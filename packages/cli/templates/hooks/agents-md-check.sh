#!/bin/bash
# Safeword AGENTS.md self-healing hook
# Ensures the AGENTS.md link is always present

LINK='**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**'

if [ ! -d ".safeword" ]; then
  # Not a safeword project, skip
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
