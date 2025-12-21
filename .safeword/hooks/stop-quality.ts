#!/usr/bin/env bun
// Safeword: Auto Quality Review Stop Hook
// Triggers quality review when changes are proposed or made
// Looks for {"proposedChanges": ..., "madeChanges": ...} JSON blob

import { existsSync } from 'node:fs';

import { QUALITY_REVIEW_MESSAGE } from './lib/quality.ts';

interface HookInput {
  transcript_path?: string;
}

interface TranscriptMessage {
  role: string;
  message?: {
    content?: { type: string; text?: string }[];
  };
}

interface ResponseSummary {
  proposedChanges: boolean;
  madeChanges: boolean;
}

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const safewordDir = `${projectDir}/.safeword`;

// Not a safeword project, skip silently
if (!existsSync(safewordDir)) {
  process.exit(0);
}

// Read hook input from stdin
let input: HookInput;
try {
  input = await Bun.stdin.json();
} catch (error) {
  if (process.env.DEBUG) console.error('[stop-quality] stdin parse error:', error);
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
const lines = transcriptText.trim().split('\n');

// Find last assistant message with text content (search backwards)
let messageText: string | null = null;
for (let i = lines.length - 1; i >= 0; i--) {
  try {
    const message: TranscriptMessage = JSON.parse(lines[i]);
    if (message.role === 'assistant' && message.message?.content) {
      const textContent = message.message.content.find(c => c.type === 'text' && c.text);
      if (textContent?.text) {
        messageText = textContent.text;
        break;
      }
    }
  } catch {
    // Skip invalid JSON lines
  }
}

if (!messageText) {
  process.exit(0);
}

/**
 * Extract all JSON objects from text using brace-balanced scanning.
 * Handles nested objects and braces inside strings correctly.
 */
function extractJsonObjects(text: string): string[] {
  const results: string[] = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === '{') {
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

        if (char === '\\' && inString) {
          escape = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '{') depth++;
          if (char === '}') depth--;

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

const candidates = extractJsonObjects(messageText);

function isValidSummary(object: unknown): object is ResponseSummary {
  return (
    typeof object === 'object' &&
    object !== null &&
    typeof (object as ResponseSummary).proposedChanges === 'boolean' &&
    typeof (object as ResponseSummary).madeChanges === 'boolean'
  );
}

let summary: ResponseSummary | null = null;
for (const candidate of candidates) {
  try {
    const parsed = JSON.parse(candidate);
    if (isValidSummary(parsed)) {
      summary = parsed;
    }
  } catch {
    // Not valid JSON, skip
  }
}

if (!summary) {
  // No valid JSON blob found - remind about required format (JSON stdout + exit 0 per Claude Code docs)
  console.log(
    JSON.stringify({
      decision: 'block',
      reason:
        'SAFEWORD: Response missing required JSON summary. Add to end of response:\n{"proposedChanges": boolean, "madeChanges": boolean}',
    })
  );
  process.exit(0);
}

// If either proposed or made changes, trigger quality review (JSON stdout + exit 0 per Claude Code docs)
if (summary.proposedChanges || summary.madeChanges) {
  console.log(JSON.stringify({ decision: 'block', reason: QUALITY_REVIEW_MESSAGE }));
  process.exit(0);
}