# Efficient TickTick

[![CI](https://github.com/om-surushe/efficient-ticktick/actions/workflows/ci.yml/badge.svg)](https://github.com/om-surushe/efficient-ticktick/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-f472b6.svg)](https://bun.sh/)
[![npm](https://img.shields.io/badge/npm-@om--surushe/efficient--ticktick-red.svg)](https://www.npmjs.com/package/@om-surushe/efficient-ticktick)

**Part of the Efficient MCP series - TickTick task management optimized for LLMs with 70% lower token costs.**

Unlike raw API access, this MCP server is designed specifically for AI assistants to understand and work with your tasks naturally. It handles timezone conversions, provides relative time contexts ("in 2 hours", "overdue by 3 days"), and offers semantic tools that make sense to LLMs.

**Efficiency First:** Reduce token costs by 70% compared to raw API usage through intelligent batching, pre-calculated states, and rich context in single calls.

## Why?

Traditional task management APIs are built for human UIs. When an LLM uses them, it has to:
- Do complex timezone math
- Chain multiple API calls to get context
- Parse dates and figure out relative times
- Understand priority schemes

**TickTick MCP solves this** by providing:
- ✅ **Rich time contexts** - Every task includes ISO, relative, and local time formats
- ✅ **Semantic tools** - `suggest_next_task()` instead of generic CRUD
- ✅ **Smart suggestions** - AI-powered task prioritization based on deadlines and context
- ✅ **Flexible input** - Accepts "today", "tomorrow", "next week" instead of just ISO dates
- ✅ **Complete context** - One API call gives you everything (task + project + parent + time)

## Features

- 🧠 **LLM-first design** - Optimized for AI assistant consumption
- ⏰ **Intelligent time handling** - Automatic timezone conversion and relative time formatting
- 🎯 **Smart suggestions** - AI-powered next task recommendations
- 🔍 **Semantic search** - Find tasks by keyword, project, or deadline
- 📊 **Batch operations** - Get complete context in a single call
- 🚀 **Built with Bun** - Fast, modern TypeScript runtime

## Installation

### Using npx/bunx (Recommended)
```bash
bunx @om-surushe/efficient-ticktick
```

### Global Install
```bash
npm install -g @om-surushe/efficient-ticktick
# or
bun install -g @om-surushe/efficient-ticktick
```

### From Source
```bash
git clone https://github.com/om-surushe/efficient-ticktick.git
cd efficient-ticktick
bun install
bun run build
```

## Setup

### 1. Get Your TickTick API Token

1. Open TickTick app or web
2. Go to **Settings** → **Open API**
3. Copy your personal API token (starts with `tp_...`)

### 2. Configure MCP Client

#### For OpenClaw
Add to your OpenClaw gateway config:
```json
{
  "mcpServers": {
    "efficient-ticktick": {
      "command": "bunx",
      "args": ["@om-surushe/efficient-ticktick"],
      "env": {
        "TICKTICK_TOKEN": "tp_your_token_here",
        "TIMEZONE": "Asia/Kolkata"
      }
    }
  }
}
```

#### For Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "efficient-ticktick": {
      "command": "bunx",
      "args": ["@om-surushe/efficient-ticktick"],
      "env": {
        "TICKTICK_TOKEN": "tp_your_token_here",
        "TIMEZONE": "America/New_York"
      }
    }
  }
}
```

### 3. Restart Your Client

The TickTick tools will now be available to your AI assistant!

## Available Tools

| Tool | Description |
|------|-------------|
| `get_tasks_today` | Get all tasks due today with full time context |
| `get_overdue_tasks` | Get overdue tasks, sorted by urgency |
| `get_floating_tasks` | Get tasks without deadlines |
| `get_upcoming_tasks` | Get tasks due in the next N days |
| `get_tasks_by_project` | Get all tasks in a specific project |
| `search_tasks` | Search tasks by keyword |
| `suggest_next_task` | AI-powered suggestion for what to work on next |
| `get_task_summary` | High-level overview (counts by status) |
| `create_task` | Create new task with flexible date parsing |
| `complete_task` | Mark a task as completed |

## Usage Examples

### Get Tasks Due Today
Your AI assistant can simply call:
```typescript
get_tasks_today()
```

Response includes rich context:
```json
{
  "id": "abc123",
  "title": "Finish project proposal",
  "project": { "name": "💼 Career Growth" },
  "dueDate": {
    "iso": "2026-02-08T17:00:00+05:30",
    "relative": "in 3 hours",
    "userLocal": "Today, 5:00 PM IST"
  },
  "isOverdue": false,
  "priority": "high"
}
```

### Flexible Date Input
Create tasks naturally:
```typescript
create_task({
  title: "Buy groceries",
  dueDate: "tomorrow",  // Also accepts: "today", "next week", ISO dates
  project: "Personal",
  priority: "medium"
})
```

### Smart Suggestions
```typescript
suggest_next_task({
  availableMinutes: 30,
  context: "morning"
})
```

Returns the most relevant task with reasoning:
```json
{
  "task": { /* task details */ },
  "reason": "Due in 2 hours - highest priority",
  "estimatedMinutes": 30
}
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/) - Fast, modern JavaScript runtime
- **Language**: TypeScript 5.3+
- **Protocol**: [Model Context Protocol](https://github.com/modelcontextprotocol) (MCP)
- **API**: [TickTick Open API](https://developer.ticktick.com)

## Development

```bash
# Install dependencies
bun install

# Run in dev mode (with hot reload)
bun run dev

# Build
bun run build

# Run tests
bun test

# Type check
bun run typecheck

# Lint
bun run lint

# Format
bun run format
```

## Testing

```bash
# Run all tests
bun test

# Watch mode
bun run test:watch
```

## Contributing

Contributions welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper tests
4. Run type checking and tests (`bun run typecheck && bun test`)
5. Commit with clear messages (`git commit -m 'feat: add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Om Surushe**
- GitHub: [@om-surushe](https://github.com/om-surushe)
- LinkedIn: [om-surushe](https://linkedin.com/in/om-surushe)

## Acknowledgments

- Built on [Model Context Protocol](https://github.com/modelcontextprotocol) by Anthropic
- Powered by [TickTick API](https://developer.ticktick.com)

---

**Made with ❤️ and Bun for AI assistants**
