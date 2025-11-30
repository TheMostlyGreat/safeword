#!/bin/bash
# Safeword: Display version on session start (SessionStart)
# Shows current safeword version and confirms hooks are active

# Change to project directory if set
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR"

if [ ! -d ".safeword" ]; then
  exit 0
fi

VERSION="unknown"
if [ -f ".safeword/version" ]; then
  VERSION=$(cat .safeword/version)
fi

echo "SAFE WORD Claude Config v${VERSION} installed - auto-linting and quality review active"
