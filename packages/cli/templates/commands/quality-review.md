---
description: Deep code review with web research against latest docs and versions
---

# Quality Review

Perform a deep code review with web research to verify against latest documentation.

## Instructions

When the user invokes this command:

1. **Identify the scope** - Ask what code to review if not specified
2. **Fetch current docs** - Use WebFetch/WebSearch for libraries being used
3. **Check versions** - Verify dependencies are current and secure
4. **Analyze deeply** - Look for:
   - Performance issues
   - Security vulnerabilities
   - Deprecated APIs
   - Better alternatives
   - Missing error handling
5. **Report findings** - Provide actionable recommendations

## Example Usage

```text
/quality-review
```

Then: "Review the authentication implementation" or "Check if my React hooks are following best practices"
