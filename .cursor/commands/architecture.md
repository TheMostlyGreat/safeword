---
description: Review code against architecture guidelines and layer boundaries
---

# Architecture Review

Review code changes against project architecture guidelines and dependency boundaries.

## Instructions

When the user invokes this command:

1. **Read architecture docs** - Check `.safeword/guides/architecture-guide.md` if it exists
2. **Identify layers** - Map the project's architectural layers (types, utils, services, components, etc.)
3. **Check boundaries** - Verify imports follow the hierarchy:
   - Lower layers cannot import from higher layers
   - `types` → `utils` → `lib` → `hooks/services` → `components` → `features` → `app`
4. **Validate dependencies** - Ensure dependency directions are correct
5. **Report violations** - List any boundary violations with specific file:line references

## Example Usage

```text
/architecture
```

Then: "Review my recent changes" or "Check if the new auth module follows our architecture"
