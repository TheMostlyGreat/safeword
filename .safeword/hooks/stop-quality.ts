#!/usr/bin/env bun
// Safeword: Auto Quality Review Stop Hook
// Triggers quality review when changes are proposed or made
// Looks for {"proposedChanges": ..., "madeChanges": ..., "askedQuestion": ...} JSON blob

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
  askedQuestion: boolean;
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

// Extract JSON blob containing our required fields
// Note: This regex only matches flat objects (no nested braces).
// The response summary is expected to be flat: {proposedChanges, madeChanges, askedQuestion}
const jsonPattern = /\{[^{}]+\}/g;
const candidates = messageText.match(jsonPattern) ?? [];

function isValidSummary(object: unknown): object is ResponseSummary {
  return (
    typeof object === 'object' &&
    object !== null &&
    typeof (object as ResponseSummary).proposedChanges === 'boolean' &&
    typeof (object as ResponseSummary).madeChanges === 'boolean' &&
    typeof (object as ResponseSummary).askedQuestion === 'boolean'
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
  // No valid JSON blob found - remind about required format
  console.error('SAFEWORD: Response missing required JSON summary. Add to end of response:');
  console.error('{"proposedChanges": boolean, "madeChanges": boolean, "askedQuestion": boolean}');
  process.exit(2);
}

// If either proposed or made changes, trigger quality review
if (summary.proposedChanges || summary.madeChanges) {
  console.error(QUALITY_REVIEW_MESSAGE);
  process.exit(2);
}
