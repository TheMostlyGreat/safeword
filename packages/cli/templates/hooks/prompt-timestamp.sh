#!/bin/bash
# Safeword: Inject timestamp (UserPromptSubmit)
# Outputs current timestamp for Claude's context awareness
# Helps with accurate ticket timestamps and time-based reasoning

# Natural language day/time in UTC
natural=$(date -u +"%A, %B %d, %Y at %H:%M UTC")
# ISO 8601 UTC
iso=$(date -u +%Y-%m-%dT%H:%M:%SZ)
# Local timezone
local_time=$(date +"%H:%M %Z")

echo "Current time: $natural ($iso) | Local: $local_time"
