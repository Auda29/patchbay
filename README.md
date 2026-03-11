# Patchbay

A lightweight control plane for AI-assisted software development.

> A central dashboard that coordinates existing tools like Cursor, Claude Code, Codex, Bash, and HTTP runners as managed workers via CLI or standardized adapters.

## The Problem

Many developers work in parallel with Cursor, Claude Code, Codex, terminals, and other AI tools. The problem isn't the quality of these tools — it's that **context gets lost**, tasks are scattered across chat windows and terminals, decisions go undocumented, and it's unclear which tool changed what.

## What is Patchbay?

Patchbay is **not** a new IDE or coding agent. It's a **command center** that sits on top of your existing tools and provides:

- **Structured task management** — tasks, runs, decisions, and artifacts in a single place
- **Runner dispatch** — send tasks to Bash, HTTP, Cursor, Cursor CLI, Claude Code, Codex, or Gemini runners from one dashboard
- **Run history** — every execution is logged with status, output, diffs, and blockers
- **Decision log** — document and track technical decisions with rationale and approvals
- **File-based state** — everything lives in `.project-agents/` inside your repo, git-versioned and transparent

**Target audience:** solo developers, small teams, OSS maintainers, side projects.

## Principles

| Principle | What it means |
|-----------|--------------|
| **Dashboard-first** | The dashboard is the control center, not decoration |
| **Repo-first** | State lives in `.project-agents/`, git-versioned, no cloud required |
| **CLI-first** | CLI as the robust, loggable integration layer |
| **Tool-agnostic** | No lock-in — Bash, Cursor, Claude Code, HTTP, or custom runners |

## Architecture

Patchbay is a monorepo with four package groups:

```
patchbay/
├── schema/                        # JSON Schema definitions for .project-agents/
├── packages/
│   ├── core/                      # Orchestrator, Store, Runner interface, Types
│   ├── cli/                       # CLI tool (patchbay init, task, run, status)
│   ├── dashboard/                 # Next.js web dashboard
│   └── runners/                   # Runner adapters
│       ├── bash/                  #   Shell command execution
│       ├── http/                  #   HTTP/API requests
│       ├── cursor/                #   Cursor file-based (manual handoff)
│       ├── cursor-cli/            #   Cursor headless (cursor agent -p)
│       ├── claude-code/           #   Claude Code CLI (claude -p)
│       ├── codex/                 #   OpenAI Codex CLI (codex exec)
│       └── gemini/                #   Google Gemini CLI (gemini -p)
└── package.json                   # npm workspaces root
```

### Core Concepts

**`.project-agents/` directory** — the shared contract between Patchbay, its runners, and any client (like Wintermute):

```
.project-agents/
├── project.yml                    # Project name, goal, rules, tech stack
├── agents/                        # Runner/agent profiles (YAML)
├── tasks/                         # Task definitions (Markdown with YAML frontmatter)
├── runs/                          # Execution logs (JSON)
├── decisions/                     # Technical decisions (JSON)
└── context/                       # Shared context files for agents
```

**Task lifecycle:**
`open` → `in_progress` → `review` → `done` (or `blocked` at any point)

**Run lifecycle:**
`running` → `completed` | `failed` | `cancelled`

### Packages

**`@patchbay/core`** — the orchestration engine:
- `Store` — file-based state management with AJV schema validation
- `Orchestrator` — task state transitions, runner dispatch, result collection
- `Runner` interface — minimal contract (`execute(input) → output`) that all adapters implement

**`@patchbay/cli`** — command-line interface:
- `patchbay init` — project setup (interactive or `--yes` for non-interactive), creates `.project-agents/` structure
- `patchbay task create|list|status` — task management
- `patchbay run <taskId> <runnerId>` — dispatch a task to a runner
- `patchbay auth set|list|clear` — manage runner authentication (API keys or subscription mode)
- `patchbay serve [--port 3001] [--repo-root .]` — start standalone HTTP server (Phase 7b, in progress)

**Dashboard** — Next.js web application:
- Project overview with stats and recent activity
- Inline editing for project goal, rules, and tech stack
- Kanban task board (open → in_progress → review → done)
- Run viewer with expandable logs, blockers, and suggested next steps
- Diff/artifact viewer
- Decision log
- Interactive dispatch: select a task and runner, execute from the browser

**Runners:**

| Runner | How it works |
|--------|-------------|
| **Bash** | Executes shell commands, captures stdout/stderr |
| **HTTP** | Makes HTTP requests, returns response body |
| **Cursor** | Writes context to `current-focus.md`, returns `blocked` (manual handoff) |
| **Cursor CLI** | Runs `cursor agent -p <prompt>` headless |
| **Claude Code** | Runs `claude -p <prompt>` with project context |
| **Codex** | Runs `codex exec <prompt>` with project context |
| **Gemini** | Runs `gemini -p <prompt>` with project context |

### API

The dashboard exposes REST endpoints (Next.js API routes):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/state` | GET | Full project state (project, tasks, runs, decisions) |
| `/api/tasks` | POST | Create a new task |
| `/api/tasks` | PATCH | Update task status |
| `/api/runs` | GET | List runs (optional `?taskId=` filter) |
| `/api/runs` | POST | Save a run (for external clients like wntrmte) |
| `/api/dispatch` | POST | Dispatch a task to a runner |
| `/api/agents` | GET | List available runners |
| `/api/decisions` | POST | Create a technical decision |
| `/api/artifacts` | GET | List context files and diff references |
| `/api/events` | GET | SSE stream — real-time change notifications |

## Quickstart

### Patchbay Standalone

```bash
# Install dependencies
npm install

# Initialize a project
cd /path/to/your/repo
npx patchbay init

# Start the dashboard
cd packages/dashboard
PATCHBAY_REPO_ROOT=/path/to/your/repo npm run dev
# → http://localhost:3000

# Or use the CLI
npx patchbay task create
npx patchbay run TASK-001 bash
npx patchbay status
```

`npm run dev` currently starts the dashboard in webpack-based dev mode. That is intentional for now because it is more reliable than Turbopack in the embedded Wintermute workflow, especially on Windows.

### Patchbay + Wintermute

1. Initialize Patchbay in your repo:

```bash
cd /path/to/your/repo
npx patchbay init
```

2. Open the same repo in Wintermute.
3. Use Wintermute in offline mode to browse `.project-agents/` tasks, runs, and decisions directly from the editor.
4. Optionally start the Patchbay dashboard for connected mode and live updates:

```bash
cd /path/to/patchbay/packages/dashboard
PATCHBAY_REPO_ROOT=/path/to/your/repo npm run dev
```

5. Dispatch a task from Wintermute via the runner picker. Wintermute delegates execution to:

```bash
patchbay run <taskId> <runnerId>
```

### Runner Auth

For CLI-based runners, you can configure auth once via `patchbay auth`:

```bash
# API key mode
npx patchbay auth set claude-code --api-key <key>
npx patchbay auth set codex --api-key <key>
npx patchbay auth set gemini --api-key <key>

# Or subscription/login mode where supported
npx patchbay auth set claude-code --subscription

# Inspect configured auth
npx patchbay auth list
```

`--subscription` stores the auth mode for that runner and assumes the underlying CLI already has a valid login context. It does not trigger a browser sign-in flow by itself.

## Companion: Wintermute

Patchbay works standalone with any editor, but has first-class integration with [Wintermute](https://github.com/Auda29/wntrmte) — a minimalist VS Code distribution with a built-in Patchbay client extension.

Patchbay thinks from the outside in (external dashboard). Wintermute thinks from the inside out (native IDE integration). Together they form a coherent abstraction layer:

- **Offline:** Wintermute reads `.project-agents/` directly — no Patchbay backend needed
- **Connected:** Wintermute connects via HTTP/SSE for real-time updates, run submission, and an embedded dashboard webview
- **Agent dispatch:** Wintermute delegates to Patchbay CLI (`patchbay run`) for task execution, with runner picker and live output streaming

## Roadmap

- [x] Phase 1: Schema & data model (`.project-agents/` format, JSON Schemas)
- [x] Phase 2: Orchestrator core (Store, Runner interface, task dispatch)
- [x] Phase 3: Dashboard (Next.js, Kanban board, run viewer, dispatch)
- [x] Phase 4: Runner adapters (Bash, HTTP, Cursor, Cursor CLI, Claude Code)
- [x] Phase 5: Wintermute integration (SSE events, runs API, connected mode)
- [x] Phase 6: Auth system + Codex/Gemini runners + PatchbayRunner (CLI delegation)
- [x] Phase 7a: Non-interactive `patchbay init --yes` for CLI delegation from wntrmte extension
- [~] Phase 7b: Standalone HTTP server (`@patchbay/server`) — scaffolded, `/state` + `/health` + `patchbay serve` done; remaining routes + SSE pending

See [PLAN.md](PLAN.md) for the detailed technical roadmap.

## License

MIT
