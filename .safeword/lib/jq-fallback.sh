#!/bin/bash
# Fallback JSON output when jq is not available
# Uses printf for safe JSON string escaping

# Escape a string for JSON output
json_escape() {
  local str="$1"
  str="${str//\\/\\\\}"
  str="${str//\"/\\\"}"
  str="${str//$'\n'/\\n}"
  str="${str//$'\t'/\\t}"
  echo "$str"
}

# Output a simple JSON object with one key-value pair
json_kv() {
  local key="$1"
  local value="$2"
  printf '{"proposedChanges": false, "madeChanges": false, "askedQuestion": false, "%s": "%s"}\n' "$key" "$(json_escape "$value")"
}
