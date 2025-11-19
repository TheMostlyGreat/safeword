#!/bin/bash
# Auto Quality Review Stop Hook
# Triggers quality review when changes are proposed or made
# Only runs for projects with AGENTS.md or CLAUDE.md (searches upward)
# Looks for {"proposedChanges": ..., "madeChanges": ...} JSON blob

# Debug logging
DEBUG_LOG="/tmp/auto-quality-review-debug.log"
echo "=== Hook triggered at $(date) ===" >> "$DEBUG_LOG"
echo "PWD: $PWD" >> "$DEBUG_LOG"

# Read hook input from stdin
input=$(cat)
echo "Input: $input" >> "$DEBUG_LOG"

# Check for project-level AGENTS.md or CLAUDE.md
# Search upward from current directory (supports monorepos)
current_dir="$PWD"
echo "Searching for AGENTS.md or CLAUDE.md..." >> "$DEBUG_LOG"
while true; do
  if [ -f "$current_dir/AGENTS.md" ] || [ -f "$current_dir/CLAUDE.md" ]; then
    echo "Found context file in: $current_dir" >> "$DEBUG_LOG"
    break  # Found context file
  fi

  # Reached root without finding context file
  if [ "$current_dir" = "/" ]; then
    echo "No AGENTS.md or CLAUDE.md found, exiting" >> "$DEBUG_LOG"
    exit 0
  fi

  current_dir=$(dirname "$current_dir")
done

# Read project config (defaults: enabled=true, ask_questions=true)
config_file="$current_dir/.auto-quality-review.config"
enabled=true
ask_questions=true

if [ -f "$config_file" ]; then
  while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    case "$key" in
      enabled)
        enabled="$value"
        ;;
      ask_questions)
        ask_questions="$value"
        ;;
    esac
  done < "$config_file"
fi

# Exit if disabled for this project
echo "Config: enabled=$enabled, ask_questions=$ask_questions" >> "$DEBUG_LOG"
if [ "$enabled" != "true" ]; then
  echo "Hook disabled for this project, exiting" >> "$DEBUG_LOG"
  exit 0
fi

# Get transcript path
if ! transcript_path=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null); then
  echo "ERROR: jq failed to extract transcript_path from hook input." >&2
  echo "ERROR: jq failed to parse input" >> "$DEBUG_LOG"
  exit 2
fi

echo "Transcript path: $transcript_path" >> "$DEBUG_LOG"
if [ -z "$transcript_path" ] || [ ! -f "$transcript_path" ]; then
  echo "No transcript or file doesn't exist, exiting" >> "$DEBUG_LOG"
  exit 0
fi

# Extract last assistant message from transcript
# Transcript is JSONL format - each line is a message
last_assistant_msg=$(grep '"role":"assistant"' "$transcript_path" | tail -1)

echo "Last assistant message length: ${#last_assistant_msg}" >> "$DEBUG_LOG"
if [ -z "$last_assistant_msg" ]; then
  # Normal case: No assistant messages yet
  echo "No assistant messages found, exiting" >> "$DEBUG_LOG"
  exit 0
fi

# Extract the text content from the message
# Looking for the final JSON blob: {"proposedChanges": ..., "madeChanges": ...}
if ! msg_text=$(echo "$last_assistant_msg" | jq -r '.message.content[]? | select(.type == "text") | .text' 2>/dev/null); then
  echo "ERROR: jq failed to parse assistant message structure. Transcript format may have changed." >&2
  echo "DEBUG: Message structure: $(echo "$last_assistant_msg" | jq -r '.message.content[].type' 2>/dev/null)" >> "$DEBUG_LOG"
  exit 2
fi

if [ -z "$msg_text" ]; then
  # Normal case: Message has no text content
  exit 0
fi

# Extract the JSON blob from the end of the message
# Pattern: {"proposedChanges": boolean, "madeChanges": boolean}
json_blob=$(echo "$msg_text" | grep -oE '\{"proposedChanges":\s*(true|false)\s*,\s*"madeChanges":\s*(true|false)\s*\}' | tail -1)

echo "JSON blob: $json_blob" >> "$DEBUG_LOG"
if [ -z "$json_blob" ]; then
  # Normal case: No JSON blob found (informational response, no changes)
  echo "No JSON blob found, exiting" >> "$DEBUG_LOG"
  exit 0
fi

# Parse the boolean values
if ! proposed_changes=$(echo "$json_blob" | jq -r '.proposedChanges // false' 2>/dev/null); then
  echo "ERROR: jq failed to parse proposedChanges field from JSON blob." >&2
  exit 2
fi

if ! made_changes=$(echo "$json_blob" | jq -r '.madeChanges // false' 2>/dev/null); then
  echo "ERROR: jq failed to parse madeChanges field from JSON blob." >&2
  exit 2
fi

# If either is true, trigger quality review
echo "proposedChanges=$proposed_changes, madeChanges=$made_changes" >> "$DEBUG_LOG"
if [ "$proposed_changes" = "true" ] || [ "$made_changes" = "true" ]; then
  # Block and request quality review
  echo "TRIGGERING QUALITY REVIEW" >> "$DEBUG_LOG"
  echo "Double check and critique your work just in case." >&2
  echo "" >&2
  echo "- Is it correct?" >&2
  echo "- Is it elegant?" >&2
  echo "- Does it adhere to the latest documentation and best practices for the relevant stack items, UX principles, domain requirements, and testing practices?" >&2

  if [ "$ask_questions" = "true" ]; then
    echo "- Ask me any non-obvious questions you can't research yourself in the codebase or online." >&2
  fi

  echo "- Think hard." >&2
  echo "- Avoid bloat." >&2
  exit 2
fi

# No changes proposed or made - allow continuation
exit 0
