#!/usr/bin/env bash
# Pre-hook: Question-asking protocol
# Triggers on UserPromptSubmit (20+ chars) to guide clarifying questions

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "<question-protocol>Research first. Ask 1-5 questions ONLY about what to build (not how) that only user knows. Skip searchable things. Unsure? Ask.</question-protocol>"
  }
}
EOF
