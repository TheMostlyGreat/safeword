# SAFEWORD Configuration

This directory contains safeword configuration for AI coding agents.

## Structure

- `SAFEWORD.md` - This file (main configuration)
- `guides/` - Reference documentation
- `templates/` - Document templates
- `hooks/` - Claude Code hook scripts
- `version` - Installed safeword version

## Usage

The AGENTS.md file in your project root should reference this configuration:

```markdown
**⚠️ ALWAYS READ FIRST: @./.safeword/SAFEWORD.md**
```

This ensures AI agents read the safeword configuration before any other context.

## Customization

You can customize the guides and templates, but note that running `safeword upgrade`
will overwrite changes. Keep customizations in separate files if needed.

## Commands

- `safeword check` - Verify configuration health
- `safeword upgrade` - Update to latest templates
- `safeword diff` - Preview upgrade changes
- `safeword reset` - Remove safeword configuration
