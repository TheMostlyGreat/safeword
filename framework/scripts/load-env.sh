#!/usr/bin/env bash
# Load environment variables from .env file
# Source this in other scripts: source "$(dirname "$0")/load-env.sh"
#
# Priority: Shell env > .env.local > .env
# Does NOT override existing shell variables

set -euo pipefail

# Find project root (look for .git or package.json)
find_project_root() {
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/package.json" ]] || [[ -d "$dir/.git" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  echo "$PWD"
}

PROJECT_ROOT="${PROJECT_ROOT:-$(find_project_root)}"

# Load .env file (does not override existing vars)
load_env_file() {
  local env_file="$1"
  if [[ -f "$env_file" ]]; then
    while IFS='=' read -r key value; do
      # Skip comments and empty lines
      [[ "$key" =~ ^#.*$ ]] && continue
      [[ -z "$key" ]] && continue
      
      # Trim whitespace
      key="${key// /}"
      value="${value%"${value##*[![:space:]]}"}"
      
      # Only set if not already in environment
      if [[ -z "${!key:-}" ]]; then
        export "$key=$value"
      fi
    done < "$env_file"
  fi
}

# Load in priority order (first wins due to skip-if-exists logic)
load_env_file "$PROJECT_ROOT/.env.local"
load_env_file "$PROJECT_ROOT/.env"

