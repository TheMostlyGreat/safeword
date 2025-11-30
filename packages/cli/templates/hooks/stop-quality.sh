#!/bin/bash
# Safeword: Quality review on stop (Stop)
# Triggers a quality review reminder when Claude stops

# Change to project directory if set
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR"

# Default JSON response (no changes)
json_response() {
  local msg="$1"
  if [ -n "$msg" ]; then
    echo "{\"proposedChanges\": false, \"madeChanges\": false, \"askedQuestion\": false, \"message\": \"$msg\"}"
  else
    echo '{"proposedChanges": false, "madeChanges": false, "askedQuestion": false}'
  fi
}

if [ ! -d ".safeword" ]; then
  json_response
  exit 0
fi

# Check if there are uncommitted changes
if ! command -v git &> /dev/null; then
  json_response
  exit 0
fi

if [ ! -d ".git" ]; then
  json_response
  exit 0
fi

# Check for modified files
changed_files=$(git diff --name-only 2>/dev/null | head -10)
staged_files=$(git diff --staged --name-only 2>/dev/null | head -10)

if [ -n "$changed_files" ] || [ -n "$staged_files" ]; then
  # Build file list for message
  file_count=0
  [ -n "$staged_files" ] && file_count=$((file_count + $(echo "$staged_files" | wc -l)))
  [ -n "$changed_files" ] && file_count=$((file_count + $(echo "$changed_files" | wc -l)))

  json_response "SAFEWORD: $file_count file(s) modified. Consider '/quality-review' before committing."
else
  json_response
fi

exit 0
