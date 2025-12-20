#!/bin/bash
# Auto Quality Review Stop Hook
# Triggers quality review when changes are proposed or made
# Only runs for projects with .safeword/ directory
# Looks for {"proposedChanges": ..., "madeChanges": ...} JSON blob

set -euo pipefail

# Debug logging (enable with DEBUG=1)
debug() { [[ "${DEBUG:-}" == "1" ]] && echo "[$(date '+%H:%M:%S')] $1" >> "/tmp/stop-hook-debug.log" || true; }
debug "=== Stop hook started ==="

# Change to project directory if set
[[ -n "${CLAUDE_PROJECT_DIR:-}" ]] && cd "$CLAUDE_PROJECT_DIR" || true
debug "CLAUDE_PROJECT_DIR: ${CLAUDE_PROJECT_DIR:-unset}"

# Check for .safeword directory
if [ ! -d ".safeword" ]; then
  debug "EXIT: No .safeword directory"
  exit 0
fi

# Read hook input from stdin
input=$(cat)
debug "Input length: ${#input} chars"

# Require jq for JSON parsing
if ! command -v jq &> /dev/null; then
  debug "EXIT: jq not found"
  exit 0
fi

# Get transcript path
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null)
debug "Transcript path: $transcript_path"

if [ -z "$transcript_path" ] || [ ! -f "$transcript_path" ]; then
  debug "EXIT: Transcript missing or not a file"
  exit 0
fi
debug "Transcript exists: $(wc -l < "$transcript_path") lines"

# Extract last assistant message from transcript
# Transcript is JSONL format - each line is a message
# Try both with and without space after colon
last_assistant_msg=$(grep -E '"role"\s*:\s*"assistant"' "$transcript_path" | tail -1 || true)
debug "Assistant msg grep found: $([ -n "$last_assistant_msg" ] && echo 'yes' || echo 'no')"

if [ -z "$last_assistant_msg" ]; then
  debug "EXIT: No assistant message found in transcript"
  debug "Transcript roles: $(grep -oE '"role"\s*:\s*"[^"]+"' "$transcript_path" 2>/dev/null | sort -u | tr '\n' ' ' || true)"
  exit 0
fi

# Extract the text content from the message
# If last message has no text (tool-only), search backwards for one that does
# Use tac (Linux) or tail -r (macOS) for reverse
reverse_lines() { if command -v tac &>/dev/null; then tac; else tail -r; fi; }

msg_text=""
while IFS= read -r line; do
  candidate=$(echo "$line" | jq -r '.message.content[]? | select(.type == "text") | .text' 2>/dev/null)
  if [ -n "$candidate" ]; then
    msg_text="$candidate"
    break
  fi
done < <(grep -E '"role"\s*:\s*"assistant"' "$transcript_path" | reverse_lines || true)
debug "msg_text length: ${#msg_text} chars"

# Extract JSON blob containing our required fields (order-independent)
# Strategy: Use jq to find and validate the response summary object
# Look for object with exactly our three boolean fields anywhere in the text
all_json_blobs=$(echo "$msg_text" | grep -oE '\{[^}]+\}' || true)
json_blob_count=$(printf '%s' "$all_json_blobs" | grep -c . 2>/dev/null || echo 0)
debug "Found $json_blob_count JSON-like blobs in response"

json_blob=$(echo "$all_json_blobs" | while IFS= read -r candidate; do
  if [[ -n "$candidate" ]] && echo "$candidate" | jq -e '
    type == "object" and
    (.proposedChanges | type) == "boolean" and
    (.madeChanges | type) == "boolean" and
    (.askedQuestion | type) == "boolean"
  ' >/dev/null 2>&1; then
    echo "$candidate"
  fi
done | tail -1 || true)
debug "Valid summary blob found: $([ -n "$json_blob" ] && echo 'yes' || echo 'no')"

if [ -z "$json_blob" ]; then
  debug "EXIT (code 2): No valid JSON summary blob"
  # No valid JSON blob found - remind about required format
  echo "SAFEWORD: Response missing required JSON summary. Add to end of response:" >&2
  echo '{"proposedChanges": boolean, "madeChanges": boolean, "askedQuestion": boolean}' >&2
  exit 2
fi
debug "JSON blob: $json_blob"

# Parse the boolean values (already validated, single jq call)
read -r proposed_changes made_changes asked_question <<< \
  "$(echo "$json_blob" | jq -r '[.proposedChanges, .madeChanges, .askedQuestion] | @tsv')"
debug "Parsed: proposed=$proposed_changes, made=$made_changes, asked=$asked_question"

# If asked a question, don't trigger review (waiting for user input)
if [ "$asked_question" = "true" ]; then
  debug "EXIT: Asked question, skipping review"
  exit 0
fi

# If either proposed or made changes, trigger quality review
if [ "$proposed_changes" = "true" ] || [ "$made_changes" = "true" ]; then
  debug "EXIT (code 2): Triggering quality review"
  echo "SAFEWORD Quality Review:" >&2
  echo "" >&2
  echo "Double check and critique your work again just in case." >&2
  echo "Assume you've never seen it before." >&2
  echo "" >&2
  echo "- Is it correct?" >&2
  echo "- Is it elegant?" >&2
  echo "- Does it follow latest docs/best practices?" >&2
  echo "- Ask me any non-obvious questions." >&2
  echo "- Avoid bloat." >&2
  exit 2
fi

debug "EXIT: No changes reported, no review needed"
exit 0
