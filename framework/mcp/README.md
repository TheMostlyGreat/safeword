# MCP Server Configurations

Sample configurations for Model Context Protocol (MCP) servers.

## Available Servers

| Server         | Package                 | API Key         | Purpose                        |
| -------------- | ----------------------- | --------------- | ------------------------------ |
| **Context7**   | `@upstash/context7-mcp` | Required (free) | Library docs lookups           |
| **Playwright** | `@playwright/mcp`       | None            | Browser automation (Microsoft) |
| **Arcade**     | Arcade MCP Gateway      | Required        | Tool gateway                   |

## API Keys

| Server   | Get Key                                                              |
| -------- | -------------------------------------------------------------------- |
| Context7 | [context7.com/dashboard](https://context7.com/dashboard) (free tier) |
| Arcade   | [arcade.dev](https://arcade.dev)                                     |

## Setup

### 1. Set Environment Variables

Add to `~/.zshrc` (or `~/.bashrc`):

```bash
export CONTEXT7_API_KEY="your-key-here"
export ARCADE_API_KEY="your-key-here"
```

Then reload: `source ~/.zshrc`

### 2. Add MCP Config

**Claude Desktop** — Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Cursor** — Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

MCP servers inherit environment variables from your shell automatically.

## Playwright Options

| Arg                                   | Description             |
| ------------------------------------- | ----------------------- |
| `--browser chromium\|firefox\|webkit` | Browser type            |
| `--headless`                          | Run headless            |
| `--user-data-dir <path>`              | Persist browser profile |

Example:

```json
{
  "command": "npx",
  "args": ["@playwright/mcp@latest", "--browser", "chromium", "--headless"]
}
```

## Context7 Usage

Once configured, use in prompts:

```
use context7 to look up the latest React 19 useOptimistic hook documentation
```

Context7 fetches current docs directly from source repositories.
