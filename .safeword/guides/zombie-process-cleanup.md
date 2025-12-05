# Zombie Process Cleanup (Multi-Project Environments)

**When to use:** Working on multiple projects simultaneously, especially when they share tech stacks (Next.js, Playwright, etc.)

---

## The Problem

When running dev servers and E2E tests across multiple projects, zombie processes accumulate:

- Dev servers holding ports
- Playwright browser instances
- Test runners stuck in background
- Build processes from previous sessions

**CRITICAL:** NEVER use `killall node` or `pkill -9 node` when working on multiple projects - this kills processes from ALL projects.

---

## Port-Based Cleanup (Safest for Multi-Project)

**Prerequisite:** Each project must use a different port (e.g., Project A: 3000, Project B: 3001)

**Port convention:** Dev and test instances use different ports within the same project:

- **Dev port**: Project's configured port (e.g., 3000, 5173, 8080) - manual testing
- **Test port**: Dev port + 1000 (e.g., 4000, 6173, 9080) - Playwright managed

See `development-workflow.md` → "E2E Testing with Persistent Dev Servers" for full port isolation strategy.

**Decision rule:** If unsure which cleanup method to use → port-based first (safest), then project script, then tmux.

**Recommended cleanup pattern** (replace ports with your project's ports):

```bash
# Kill both dev server AND test server ports
# Example: Next.js (3000/4000), Vite (5173/6173), or your project's ports
lsof -ti:3000 -ti:4000 | xargs kill -9 2>/dev/null

# Kill Playwright processes launched from THIS directory
pkill -f "playwright.*$(pwd)" 2>/dev/null

# Wait for cleanup
sleep 2
```

**Why this works:**

- ✅ Dev + test ports are unique to this project → safe to kill
- ✅ `$(pwd)` ensures only THIS project's tests are killed
- ✅ Other projects completely untouched

---

## Project-Specific Cleanup Script

For frequent cleanup needs, create `scripts/cleanup.sh` in each project:

```bash
#!/bin/bash
# scripts/cleanup.sh - Kill only THIS project's processes

DEV_PORT=3000                    # Dev server port (change per project)
TEST_PORT=$((DEV_PORT + 1000))   # Test server port (Playwright managed)
PROJECT_DIR="$(pwd)"

echo "Cleaning up $PROJECT_DIR (dev: $DEV_PORT, test: $TEST_PORT)..."

# Kill both dev and test servers by port
lsof -ti:$DEV_PORT -ti:$TEST_PORT | xargs kill -9 2>/dev/null

# Kill Playwright browsers for this project
ps aux | grep -E "(playwright|chromium)" | grep "$PROJECT_DIR" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null

# Kill test runners
pgrep -f "playwright test.*$(basename $PROJECT_DIR)" | xargs kill -9 2>/dev/null

echo "Cleanup complete!"
```

**Make executable:** `chmod +x scripts/cleanup.sh`

**Usage:** `./scripts/cleanup.sh`

---

## Common Patterns by Tech Stack

### Next.js Projects

```bash
# Kill Next.js dev server (port 3000)
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Kill Next.js build processes for this project
ps aux | grep "next dev" | grep "$(pwd)" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
```

### Playwright E2E Tests

```bash
# Kill Playwright browsers and test runners
pkill -f "playwright.*$(pwd)" 2>/dev/null

# Or more specific (by project name)
pkill -f "playwright.*my-project-name" 2>/dev/null
```

### Vite Projects

```bash
# Kill Vite dev server (typically port 5173)
lsof -ti:5173 | xargs kill -9 2>/dev/null
```

### React Native / Expo

```bash
# Kill Metro bundler (port 8081)
lsof -ti:8081 | xargs kill -9 2>/dev/null

# Kill Expo dev tools (port 19000-19006)
lsof -ti:19000-19006 | xargs kill -9 2>/dev/null
```

---

## Alternative: tmux/Screen Sessions

For complete isolation, run each project in its own terminal session:

```bash
# Start project in named session
tmux new -s project-name
# Run dev server here

# Kill everything in this session only
tmux kill-session -t project-name
```

**Pros:**

- ✅ Complete isolation between projects
- ✅ One command kills everything
- ✅ Can detach/reattach sessions

**Cons:**

- ⚠️ Requires learning tmux
- ⚠️ Different workflow

---

## Best Practices

1. **Assign unique ports** - Set `PORT=3000` in one project, `PORT=3001` in another
2. **Use port-based cleanup first** - Simplest and safest
3. **Create project cleanup scripts** - Reusable, documented
4. **Never `killall node`** - Too broad when working on multiple projects
5. **Clean up before starting** - Run cleanup script before `npm run dev`
6. **Check what's running** - Use `lsof -i:PORT` to see what's using a port

---

## Debugging Zombie Processes

### Find What's Using a Port

```bash
# Check what's on port 3000
lsof -i:3000

# More details
lsof -i:3000 -P -n
```

### Find All Node Processes

```bash
# List all node processes
ps aux | grep -E "(node|playwright|chromium)"

# More detailed (with working directory)
lsof -p $(pgrep node) | grep cwd
```

### Find Processes by Project Directory

```bash
# Find processes running in specific directory
ps aux | grep "/Users/alex/projects/my-project"
```

---

## Quick Reference

| Situation                                | Command                                                          |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Kill dev + test servers (use your ports) | `lsof -ti:$DEV_PORT -ti:$TEST_PORT \| xargs kill -9 2>/dev/null` |
| Kill Playwright (this project)           | `pkill -f "playwright.*$(pwd)"`                                  |
| Kill all for this project                | `./scripts/cleanup.sh`                                           |
| Check what's on port                     | `lsof -i:3000`                                                   |
| Find zombie processes                    | `ps aux \| grep -E "(node\|playwright\|chromium)"`               |
| Kill by process ID                       | `kill -9 <PID>`                                                  |

---

## What NOT to Do

❌ **DON'T:** `killall node` (kills all projects)
❌ **DON'T:** `pkill -9 node` (kills all projects)
❌ **DON'T:** Kill processes without checking working directory
❌ **DON'T:** Assume zombie browsers will clean themselves up (they won't)

✅ **DO:** Use port-based cleanup
✅ **DO:** Filter by project directory with `$(pwd)`
✅ **DO:** Create project-specific cleanup scripts
✅ **DO:** Clean up before AND after development sessions
