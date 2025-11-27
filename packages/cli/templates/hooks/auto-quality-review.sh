#!/bin/bash
# Auto Quality Review Stop Hook
# Triggers quality review when changes are proposed or made
# Only runs for projects with SAFEWORD.md or CLAUDE.md (searches upward)
# Looks for {"proposedChanges": ..., "madeChanges": ...} JSON blob

# Debug logging (persistent across reboots, user-specific)
DEBUG_DIR="$HOME/.cache/claude-hooks"
mkdir -p "$DEBUG_DIR" 2>/dev/null || DEBUG_DIR="/tmp"
DEBUG_LOG="$DEBUG_DIR/auto-quality-review-debug.log"
echo "=== Hook triggered at $(date) ===" >> "$DEBUG_LOG"
echo "PWD: $PWD" >> "$DEBUG_LOG"

# Read hook input from stdin
input=$(cat)
echo "Input: $input" >> "$DEBUG_LOG"

# Check for project-level SAFEWORD.md or CLAUDE.md
# Search upward from current directory (supports monorepos)
current_dir="$PWD"
echo "Searching for SAFEWORD.md or CLAUDE.md..." >> "$DEBUG_LOG"
while true; do
  if [ -f "$current_dir/SAFEWORD.md" ] || [ -f "$current_dir/CLAUDE.md" ]; then
    echo "Found context file in: $current_dir" >> "$DEBUG_LOG"
    break  # Found context file
  fi

  # Reached root without finding context file
  if [ "$current_dir" = "/" ]; then
    echo "No SAFEWORD.md or CLAUDE.md found, exiting" >> "$DEBUG_LOG"
    exit 0
  fi

  current_dir=$(dirname "$current_dir")
done

# Read project config (defaults: enabled=true, ask_questions=true)
config_file="$current_dir/.auto-quality-review.config"
enabled=true
ask_questions=true

if [ -f "$config_file" ]; then
  echo "Reading config from: $config_file" >> "$DEBUG_LOG"
  while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    case "$key" in
      enabled)
        enabled="$value"
        echo "  enabled=$enabled" >> "$DEBUG_LOG"
        ;;
      ask_questions)
        ask_questions="$value"
        echo "  ask_questions=$ask_questions" >> "$DEBUG_LOG"
        ;;
    esac
  done < "$config_file"
else
  echo "No config file found, using defaults" >> "$DEBUG_LOG"
fi

# Check if disabled
if [ "$enabled" != "true" ]; then
  echo "Quality review disabled via config" >> "$DEBUG_LOG"
  exit 0
fi

# Extract the transcript content (last assistant message)
# The hook receives JSON with tool_use_result.content containing the transcript
transcript=$(echo "$input" | jq -r '.tool_use_result.content // .stop_hook_result.content // .content // empty' 2>/dev/null)

if [ -z "$transcript" ]; then
  echo "No transcript found in input" >> "$DEBUG_LOG"
  exit 0
fi

echo "Transcript length: ${#transcript}" >> "$DEBUG_LOG"

# Look for JSON blob in the transcript
# Regex: {"proposedChanges": bool, "madeChanges": bool, "askedQuestion": bool}
json_blob=$(echo "$transcript" | grep -oE '\{"proposedChanges":\s*(true|false),\s*"madeChanges":\s*(true|false),\s*"askedQuestion":\s*(true|false)\}' | tail -1)

if [ -z "$json_blob" ]; then
  echo "No JSON blob found in transcript" >> "$DEBUG_LOG"
  exit 0
fi

echo "Found JSON blob: $json_blob" >> "$DEBUG_LOG"

# Parse the JSON blob
if ! proposed_changes=$(echo "$json_blob" | jq -r '.proposedChanges // false' 2>/dev/null); then
  echo "ERROR: jq failed to parse proposedChanges field from JSON blob." >&2
  exit 2
fi

if ! made_changes=$(echo "$json_blob" | jq -r '.madeChanges // false' 2>/dev/null); then
  echo "ERROR: jq failed to parse madeChanges field from JSON blob." >&2
  exit 2
fi

if ! asked_question=$(echo "$json_blob" | jq -r '.askedQuestion // false' 2>/dev/null); then
  echo "ERROR: jq failed to parse askedQuestion field from JSON blob." >&2
  exit 2
fi

# If asked question, skip quality review (waiting for user response)
echo "proposedChanges=$proposed_changes, madeChanges=$made_changes, askedQuestion=$asked_question" >> "$DEBUG_LOG"
if [ "$asked_question" = "true" ]; then
  echo "Agent asked question, skipping quality review" >> "$DEBUG_LOG"
  exit 0
fi

# If either proposed or made changes, trigger quality review
if [ "$proposed_changes" = "true" ] || [ "$made_changes" = "true" ]; then
  # Block and request quality review
  echo "TRIGGERING QUALITY REVIEW" >> "$DEBUG_LOG"

  # Find the shared quality review script (same directory as this hook)
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  # Call shared quality review script
  if [ "$ask_questions" = "true" ]; then
    exec "$SCRIPT_DIR/run-quality-review.sh"
  else
    exec "$SCRIPT_DIR/run-quality-review.sh" --no-questions
  fi
fi

# No changes proposed or made - allow continuation
exit 0



