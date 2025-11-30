#!/bin/bash
# Safeword common utilities for hook scripts

# Output JSON response for Claude Code hooks
# Usage: json_response '{"key": "value"}'
json_response() {
  echo "$1"
}

# Check if running in a safeword project
is_safeword_project() {
  [ -d ".safeword" ]
}

# Get project root (directory containing .safeword)
get_project_root() {
  local dir="$PWD"
  while [ "$dir" != "/" ]; do
    if [ -d "$dir/.safeword" ]; then
      echo "$dir"
      return 0
    fi
    dir=$(dirname "$dir")
  done
  return 1
}
