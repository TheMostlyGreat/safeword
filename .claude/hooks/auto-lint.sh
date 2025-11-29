#!/bin/bash
# PostToolUse hook - auto-lint changed files
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -n "$file_path" ] && [ -f "$file_path" ] && "$CLAUDE_PROJECT_DIR/.claude/hooks/run-linters.sh" "$file_path"
exit 0
