#!/bin/bash
# Safeword: Question protocol guidance (UserPromptSubmit)
# Reminds Claude to ask 1-5 clarifying questions for ambiguous tasks

# Change to project directory if set
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR" || true

if [ ! -d ".safeword" ]; then
  exit 0
fi

# Read the user prompt from stdin
input=$(cat)

# Only trigger on substantial prompts (more than 20 chars)
prompt_length=${#input}
if [ "$prompt_length" -lt 20 ]; then
  exit 0
fi

# Output guidance
cat << 'EOF'
SAFEWORD Question Protocol: For ambiguous or complex requests, ask 1-5 clarifying questions before proceeding. Focus on:
- Scope boundaries (what's included/excluded)
- Technical constraints (frameworks, patterns, compatibility)
- Success criteria (how will we know it's done)
EOF
