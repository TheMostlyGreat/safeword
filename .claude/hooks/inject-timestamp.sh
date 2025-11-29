#!/bin/bash
# Inject Timestamp - Notification Hook
# Outputs current Unix timestamp at session start for Claude's context awareness
# Helps with accurate ticket timestamps and time-based reasoning

echo "Current time: $(date +%s) ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
