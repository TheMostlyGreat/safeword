# Safeword CLI Reference

Commands for managing safeword in projects.

## Commands

| Command                       | Purpose                           |
| ----------------------------- | --------------------------------- |
| `npx safeword@latest setup`   | Install safeword in current project |
| `npx safeword@latest check`   | Check project health and versions |
| `npx safeword@latest upgrade` | Upgrade to latest version         |
| `npx safeword@latest diff`    | Preview changes before upgrading  |
| `npx safeword reset`          | Remove safeword from project      |

## When to Use

| Situation                  | Command                       |
| -------------------------- | ----------------------------- |
| New project setup          | `npx safeword@latest setup`   |
| Check if update available  | `npx safeword@latest check`   |
| Update after CLI release   | `npx safeword@latest upgrade` |
| See what upgrade changes   | `npx safeword@latest diff`    |
| Remove safeword completely | `npx safeword reset --full`   |

## Options

Run `npx safeword <command> --help` for command-specific options.

Common flags:

- `-y, --yes` - Skip confirmations (setup, reset)
- `-v, --verbose` - Show detailed output (diff)
- `--offline` - Skip remote version check (check)
- `--full` - Also remove linting config + packages (reset)

---

## Key Takeaways

- Always use `@latest` for setup/check/upgrade/diff to get current CLI
- Use `diff` before `upgrade` to preview changes
