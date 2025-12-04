#!/bin/bash
# Safeword: Cursor adapter for stop hook
# Checks for marker file from afterFileEdit to determine if files were modified
# Uses followup_message to inject quality review prompt into conversation

# Require jq for JSON parsing
command -v jq &> /dev/null || { echo '{}'; exit 0; }

input=$(cat)

# Get workspace root
workspace=$(echo "$input" | jq -r '.workspace_roots[0] // empty' 2>/dev/null)
[ -n "$workspace" ] && cd "$workspace" || true

# Check for .safeword directory
if [ ! -d ".safeword" ]; then
  echo '{}'
  exit 0
fi

# Check status - only proceed on completed (not aborted/error)
status=$(echo "$input" | jq -r '.status // empty' 2>/dev/null)
if [ "$status" != "completed" ]; then
  echo '{}'
  exit 0
fi

# Get loop_count to prevent infinite review loops
# When review is triggered, agent runs again with loop_count >= 1
loop_count=$(echo "$input" | jq -r '.loop_count // 0' 2>/dev/null)

if [ "$loop_count" -ge 1 ]; then
  echo '{}'
  exit 0
fi

# Check if any file edits occurred in this session by looking for recent .safeword marker
# This is a heuristic: if afterFileEdit ran recently, work was done
marker_file="/tmp/safeword-cursor-edited-$(echo "$input" | jq -r '.conversation_id // "default"' 2>/dev/null)"

if [ -f "$marker_file" ]; then
  rm -f "$marker_file"  # Clean up marker
  cat << 'EOF'
{
  "followup_message": "SAFEWORD Quality Review:\n\nDouble check and critique your work again just in case.\nAssume you've never seen it before.\n\n- Is it correct?\n- Is it elegant?\n- Does it follow latest docs/best practices?\n- Ask me any non-obvious questions.\n- Avoid bloat."
}
EOF
else
  echo '{}'
fi
