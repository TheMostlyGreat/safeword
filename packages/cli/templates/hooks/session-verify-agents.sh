#!/bin/bash
# Safeword: Verify AGENTS.md link (SessionStart)
# Self-heals by restoring the link if removed

LINK='**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**'

# Change to project directory if set
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR"

if [ ! -d ".safeword" ]; then
  # Not a safeword project, skip silently
  exit 0
fi

if [ ! -f "AGENTS.md" ]; then
  # AGENTS.md doesn't exist, create it
  echo "$LINK" > AGENTS.md
  echo "SAFEWORD: Created AGENTS.md with safeword link"
  exit 0
fi

# Check if link is present
if ! grep -q "@./.safeword/SAFEWORD.md" AGENTS.md; then
  # Link missing, prepend it
  CONTENT=$(cat AGENTS.md)
  echo -e "$LINK\n\n$CONTENT" > AGENTS.md
  echo "SAFEWORD: Restored AGENTS.md link (was removed)"
fi

exit 0
