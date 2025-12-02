#!/bin/bash
# Auto Quality Review Stop Hook
# Triggers quality review when changes are proposed or made
# Only runs for projects with .safeword/ directory
# Looks for {"proposedChanges": ..., "madeChanges": ...} JSON blob

# Change to project directory if set
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR"

# Check for .safeword directory
if [ ! -d ".safeword" ]; then
  exit 0
fi

# Read hook input from stdin
input=$(cat)

# Require jq for JSON parsing
if ! command -v jq &> /dev/null; then
  exit 0
fi

# Get transcript path
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null)

if [ -z "$transcript_path" ] || [ ! -f "$transcript_path" ]; then
  exit 0
fi

# Extract last assistant message from transcript
# Transcript is JSONL format - each line is a message
last_assistant_msg=$(grep '"role":"assistant"' "$transcript_path" | tail -1)

if [ -z "$last_assistant_msg" ]; then
  exit 0
fi

# Extract the text content from the message
msg_text=$(echo "$last_assistant_msg" | jq -r '.message.content[]? | select(.type == "text") | .text' 2>/dev/null)

if [ -z "$msg_text" ]; then
  exit 0
fi

# Extract JSON blob containing our required fields (order-independent)
# Strategy: Use jq to find and validate the response summary object
# Look for object with exactly our three boolean fields anywhere in the text
json_blob=$(echo "$msg_text" | grep -oE '\{[^}]+\}' | while IFS= read -r candidate; do
  if echo "$candidate" | jq -e '
    type == "object" and
    (.proposedChanges | type) == "boolean" and
    (.madeChanges | type) == "boolean" and
    (.askedQuestion | type) == "boolean"
  ' >/dev/null 2>&1; then
    echo "$candidate"
  fi
done | tail -1)

if [ -z "$json_blob" ]; then
  # No valid JSON blob found - remind about required format
  echo "SAFEWORD: Response missing required JSON summary. Add to end of response:" >&2
  echo '{"proposedChanges": boolean, "madeChanges": boolean, "askedQuestion": boolean}' >&2
  exit 2
fi

# Parse the boolean values (already validated, safe to extract)
proposed_changes=$(echo "$json_blob" | jq -r '.proposedChanges')
made_changes=$(echo "$json_blob" | jq -r '.madeChanges')
asked_question=$(echo "$json_blob" | jq -r '.askedQuestion')

# If asked a question, don't trigger review (waiting for user input)
if [ "$asked_question" = "true" ]; then
  exit 0
fi

# If either proposed or made changes, trigger quality review
if [ "$proposed_changes" = "true" ] || [ "$made_changes" = "true" ]; then
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

exit 0
