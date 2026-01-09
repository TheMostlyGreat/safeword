#!/usr/bin/env bun
// Safeword: Auto Quality Review Stop Hook
// Triggers quality review when changes are proposed or made
// Uses JSON summary if available, falls back to detecting edit tool usage
// Phase-aware: reads ticket phase for context-appropriate review questions

import { existsSync, readdirSync, readFileSync } from "node:fs";

import { getQualityMessage, type BddPhase } from "./lib/quality.ts";

interface HookInput {
  transcript_path?: string;
}

interface ContentItem {
  type: string;
  text?: string;
  name?: string; // for tool_use
}

interface TranscriptMessage {
  type: string; // "assistant" | "user" | etc at top level
  message?: {
    role?: string;
    content?: ContentItem[];
  };
}

interface ResponseSummary {
  proposedChanges: boolean;
  madeChanges: boolean;
}

const EDIT_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const safewordDir = `${projectDir}/.safeword`;
const ticketsDir = `${projectDir}/.safeword-project/tickets`;

/**
 * Read phase from the most recently modified ticket in .safeword-project/tickets/
 * Only considers tickets with status: in_progress (ignores backlog, done, etc.)
 * Skips type: epic tickets (work happens in child features/tasks)
 * Returns undefined if no matching tickets or no phase found.
 */
function getCurrentPhase(): BddPhase | undefined {
  if (!existsSync(ticketsDir)) {
    return undefined;
  }

  try {
    // List ticket folders (exclude 'completed' and 'tmp')
    const folders = readdirSync(ticketsDir).filter((f) => {
      if (f === "completed" || f === "tmp") return false;
      const ticketPath = `${ticketsDir}/${f}/ticket.md`;
      return existsSync(ticketPath);
    });
    if (folders.length === 0) return undefined;

    // Find most recently modified in_progress ticket (excluding epics)
    let latestFolder = "";
    let latestMtime = 0;
    for (const folder of folders) {
      const ticketPath = `${ticketsDir}/${folder}/ticket.md`;
      const content = readFileSync(ticketPath, "utf-8");

      // Skip tickets that aren't in_progress
      const statusMatch = content.match(/^status:\s*(\S+)/m);
      if (statusMatch?.[1] !== "in_progress") continue;

      // Skip epic tickets (work happens in children)
      const typeMatch = content.match(/^type:\s*(\S+)/m);
      if (typeMatch?.[1] === "epic") continue;

      const mtime = new Date(
        content.match(/last_modified: (.+)/)?.[1] ?? 0,
      ).getTime();
      if (mtime > latestMtime) {
        latestMtime = mtime;
        latestFolder = folder;
      }
    }

    if (!latestFolder) return undefined;

    const content = readFileSync(
      `${ticketsDir}/${latestFolder}/ticket.md`,
      "utf-8",
    );
    const phaseMatch = content.match(/^phase:\s*(\S+)/m);
    if (phaseMatch) {
      return phaseMatch[1] as BddPhase;
    }
  } catch {
    // Silent fail - use default message
  }
  return undefined;
}

// Not a safeword project, skip silently
if (!existsSync(safewordDir)) {
  process.exit(0);
}

// Read hook input from stdin
let input: HookInput;
try {
  input = await Bun.stdin.json();
} catch {
  process.exit(0);
}

const transcriptPath = input.transcript_path;
if (!transcriptPath) {
  process.exit(0);
}

const transcriptFile = Bun.file(transcriptPath);
if (!(await transcriptFile.exists())) {
  process.exit(0);
}

// Read transcript (JSONL format)
const transcriptText = await transcriptFile.text();
const lines = transcriptText.trim().split("\n");

// Only look at the LAST assistant message for JSON summary
// Scan up to 5 recent assistant messages for edit tool detection
const recentTexts: string[] = [];
let editToolsUsed = false;
let assistantMessagesChecked = 0;
const MAX_MESSAGES_FOR_TOOLS = 5;

for (
  let i = lines.length - 1;
  i >= 0 && assistantMessagesChecked < MAX_MESSAGES_FOR_TOOLS;
  i--
) {
  try {
    const message: TranscriptMessage = JSON.parse(lines[i]);
    if (message.type === "assistant" && message.message?.content) {
      assistantMessagesChecked++;

      for (const item of message.message.content) {
        // Only collect text from the FIRST (most recent) assistant message
        if (
          assistantMessagesChecked === 1 &&
          item.type === "text" &&
          item.text
        ) {
          recentTexts.push(item.text);
        }
        // Detect edit tool usage in recent messages
        if (
          item.type === "tool_use" &&
          item.name &&
          EDIT_TOOLS.has(item.name)
        ) {
          editToolsUsed = true;
        }
      }
    }
  } catch {
    // Skip invalid JSON lines
  }
}

if (recentTexts.length === 0 && !editToolsUsed) {
  process.exit(0);
}

// Combine all recent texts to search for JSON summary
const combinedText = recentTexts.join("\n");

/**
 * Extract all JSON objects from text using brace-balanced scanning.
 * Handles nested objects and braces inside strings correctly.
 */
function extractJsonObjects(text: string): string[] {
  const results: string[] = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === "{") {
      let depth = 0;
      let inString = false;
      let escape = false;
      const start = i;

      for (let j = i; j < text.length; j++) {
        const char = text[j];

        if (escape) {
          escape = false;
          continue;
        }

        if (char === "\\" && inString) {
          escape = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === "{") depth++;
          if (char === "}") depth--;

          if (depth === 0) {
            results.push(text.slice(start, j + 1));
            i = j;
            break;
          }
        }
      }
    }
    i++;
  }

  return results;
}

const candidates = extractJsonObjects(combinedText);

function isValidSummary(object: unknown): object is ResponseSummary {
  return (
    typeof object === "object" &&
    object !== null &&
    typeof (object as ResponseSummary).proposedChanges === "boolean" &&
    typeof (object as ResponseSummary).madeChanges === "boolean"
  );
}

let summary: ResponseSummary | null = null;
for (const candidate of candidates) {
  try {
    const parsed = JSON.parse(candidate);
    if (isValidSummary(parsed)) {
      summary = parsed;
      // Don't break - use last valid summary (most recent in conversation)
    }
  } catch {
    // Not valid JSON, skip
  }
}

// Get phase-aware quality message
const currentPhase = getCurrentPhase();
const qualityMessage = getQualityMessage(currentPhase);

/**
 * Evidence patterns for done phase validation.
 * Agent must show these patterns to prove completion.
 */
const DONE_EVIDENCE_PATTERNS = [
  /✓\s*\d+\/\d+\s*tests?\s*pass/i, // "✓ 156/156 tests pass"
  /\d+\/\d+\s*tests?\s*pass/i, // "156/156 tests pass"
  /all\s+\d+\s+scenarios?\s+marked/i, // "All 10 scenarios marked complete"
];

/**
 * Message shown when done phase blocks due to missing evidence.
 */
const DONE_HARD_BLOCK_MESSAGE = `SAFEWORD: Done phase requires evidence. Run /done and show results.

Expected evidence formats:
- "✓ X/X tests pass"
- "All N scenarios marked complete"

Run tests, show output, then try again.`;

/**
 * Check if transcript contains evidence of completion.
 */
function hasCompletionEvidence(text: string): boolean {
  return DONE_EVIDENCE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Hard block for done phase - uses exit 2 to force Claude to continue.
 * Claude receives stderr and must provide evidence before stopping.
 */
function hardBlockDone(reason: string): never {
  console.error(reason);
  process.exit(2);
}

/**
 * Soft block for other phases - uses JSON decision to prompt review.
 */
function softBlock(reason: string): never {
  console.log(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}

// Decision logic:
// 1. Done phase with missing evidence → hard block (exit 2)
// 2. Done phase with evidence → allow (exit 0)
// 3. Other phases → soft block with quality review

if (currentPhase === "done") {
  // Done phase: require evidence before allowing stop
  if (hasCompletionEvidence(combinedText)) {
    // Evidence found - allow stop
    process.exit(0);
  }
  // No evidence - hard block, force Claude to run /done
  hardBlockDone(DONE_HARD_BLOCK_MESSAGE);
}

// Other phases: use summary-based soft blocking
if (summary) {
  // Use reported summary
  if (summary.proposedChanges || summary.madeChanges) {
    softBlock(qualityMessage);
  }
} else if (editToolsUsed) {
  // Fallback: edit tools detected but no summary - trigger review anyway
  softBlock(
    `${qualityMessage}\n\n(Note: JSON summary was missing but edit tools were detected)`,
  );
} else {
  // No summary and no edit tools - remind about required format
  softBlock(
    'SAFEWORD: Response missing required JSON summary. Add to end of response:\n{"proposedChanges": boolean, "madeChanges": boolean}',
  );
}
