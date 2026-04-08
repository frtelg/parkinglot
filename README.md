# Parking Lot

Local-first parking lot for tracking parallel work items, lifecycle state, and comment context on one machine.

## What It Does

- Create and update parking lot items with a title and optional details.
- Move items between `active`, `resolved`, and `archived` views.
- Add, edit, and soft-delete comments with structured authorship metadata.
- Use the same core semantics through the web UI, REST API, and MCP adapter.
- Persist everything locally in SQLite with no required external services for normal use.

## Stack

- Next.js 16
- React 19
- TypeScript
- SQLite via `better-sqlite3`
- OpenSpec for change artifacts and task tracking

## AI Tooling Status

This repo now ships a global installer for attaching the parking lot tool to supported AI tools.

- OpenCode: `parking-lot` skill plus global `~/.config/opencode/opencode.json`
- Claude Code: `parking-lot` skill plus global `~/.claude.json`
- Codex: `parking-lot` skill plus global `~/.codex/config.toml`
- GitHub Copilot in VS Code: global user `mcp.json`

Current canonical sources:

- Shared parking lot skill source: `ai/skills/parking-lot/`
- MCP config templates: `ai/config/*`
- Installer: `scripts/install-ai-tooling.mjs`

The installer merges into your existing global tool config. It only adds or updates the `parkinglot` MCP entry and replaces only the `parking-lot` skill directory.

## Installation

1. Install Node.js 24.
   The repo pins Node through `.nvmrc` and expects the Node 24 major line.
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Attach To An AI Tool

Run the installer from the repo root:

```bash
npm run ai:install
```

That installs the parking lot skill and MCP wiring into your global AI tool configuration.

If you only want one tool:

```bash
npm run ai:install -- --tool opencode
npm run ai:install -- --tool claude
npm run ai:install -- --tool codex
npm run ai:install -- --tool copilot
```

Optional modes:

```bash
npm run ai:install -- --skills-only
npm run ai:install -- --mcp-only
```

### What The Installer Writes

- OpenCode MCP config: `~/.config/opencode/opencode.json`
- Claude Code MCP config: `~/.claude.json`
- Codex MCP config: `~/.codex/config.toml`
- GitHub Copilot user MCP config: `~/Library/Application Support/Code/User/mcp.json`
- Shared skills copied into:
  - `~/.config/opencode/skills/`
  - `~/.claude/skills/`
  - `~/.agents/skills/`

The installer does not replace the full config file for any tool.

- Existing unrelated MCP servers remain untouched.
- Existing `parkinglot` MCP entries are updated in place.
- Existing `parking-lot` skill directories are refreshed from this repo.

### Tool-Specific Notes

- OpenCode: restart OpenCode after install. The `parkinglot` MCP server is added to `~/.config/opencode/opencode.json`, and the `parking-lot` skill is available from `~/.config/opencode/skills/`.
- Claude Code: restart Claude Code after install. The `parkinglot` MCP server is added to `~/.claude.json`, and the `parking-lot` skill is available from `~/.claude/skills/`.
- Codex: restart Codex after install. Codex reads the global MCP entry from `~/.codex/config.toml` and scans `~/.agents/skills/` for the installed skill.
- GitHub Copilot: restart VS Code after install. The `parkinglot` server is added to your user MCP config at `~/Library/Application Support/Code/User/mcp.json`.

### If You Only Want One Tool

1. Start the app with `npm run dev`.
2. Run `npm run ai:install -- --tool <tool-name>`.
3. Restart or reload that tool.
4. Ask it to use the `parkinglot` MCP server to list or update items.

Example:

```text
List the active parking lot items using the parkinglot MCP server.
```

### Example Prompts

Use prompts like these after the installer is in place and the app is running:

```text
List the active parking lot items using the parkinglot MCP server.
```

```text
Show me item 12 with its comments using the parkinglot MCP server.
```

```text
Create a new parking lot item titled "Fix flaky API smoke test" with details "Intermittent failure in local smoke run" using the parkinglot MCP server.
```

```text
Update parking lot item 12 and change the title to "Finalize MCP installer docs" using the parkinglot MCP server.
```

```text
Add a comment to parking lot item 12 saying "Installer verified locally on Claude, Codex, OpenCode, and Copilot workspace config" using the parkinglot MCP server.
```

```text
Resolve parking lot item 12 using the parkinglot MCP server.
```

```text
Archive parking lot item 12 using the parkinglot MCP server.
```

```text
Unarchive parking lot item 12 using the parkinglot MCP server.
```

## npm Registry

This repo pins npm to the public registry through the project `.npmrc`:

```text
registry=https://registry.npmjs.org/
```

That is intended to override workstation defaults that point at a private CodeArtifact registry for normal project installs.

## Validation

Run the standard checks:

```bash
npm run lint:fix
npm run lint
npm run test
npm run build
```

## Local Data

- Default SQLite path: `data/parkinglot.db`
- Override with `PARKINGLOT_DB_PATH`
- The `data/` directory is ignored and safe to treat as local runtime state
- The app runs local SQLite schema migrations on startup, including in normal development and hot-reload flows.
- When the data model changes, add a new startup migration in `src/lib/database.ts` instead of relying on ad hoc manual DB repair.

## API

### Items

- `GET /api/items?view=active|resolved|archived`
- `POST /api/items`
- `GET /api/items/:id`
- `PATCH /api/items/:id`
- `POST /api/items/:id/resolve`
- `POST /api/items/:id/archive`
- `POST /api/items/:id/unarchive`

### Comments

- `POST /api/items/:id/comments`
- `PATCH /api/items/:id/comments/:commentId`
- `DELETE /api/items/:id/comments/:commentId`

### Semantics

- Items are never hard-deleted in v1.
- Comments are soft-deleted and removed from the normal timeline.
- Unarchiving restores the previous non-archived working state.
- Comment activity updates the parent item timestamp, but persisted drag-and-drop order controls the Active view when active items have been manually arranged.

## MCP Adapter

The repo includes a local stdio MCP server that exposes the same item and comment operations through tool calls. The AI-tool installer above wires this server into supported clients.

Entrypoint:

```bash
npm run mcp
```

The server speaks framed MCP messages over stdio, including `initialize`, `notifications/initialized`, `tools/list`, and `tools/call`.

Supported tool names:

- `list_items`
- `get_item`
- `create_item`
- `update_item`
- `resolve_item`
- `archive_item`
- `unarchive_item`
- `create_comment`
- `update_comment`
- `delete_comment`

## Agent Workflow Notes

- Shared service layer: `src/lib/parking-lot.ts`
- Shared response contracts: `src/lib/contracts.ts`
- MCP adapter: `src/lib/mcp-server.ts` and `scripts/parking-lot-mcp.mjs`
- Canonical repo skill source: `ai/skills/parking-lot/`
- AI-tool installer: `scripts/install-ai-tooling.mjs`

The intent is that web UI, REST callers, and agent runtimes all reuse the same item and comment semantics rather than reimplementing business rules separately.

## OpenSpec

This repo uses OpenSpec as part of the source of truth for proposed and implemented changes.

Committed OpenSpec files include:

- `openspec/config.yaml`
- `openspec/changes/<change>/proposal.md`
- `openspec/changes/<change>/design.md`
- `openspec/changes/<change>/tasks.md`
- `openspec/changes/<change>/specs/**/*.md`

That is normal and recommended when the repo is using OpenSpec intentionally, because those files document requirements, design decisions, and task progress that the implementation is expected to follow.

## Repo Notes

- `.opencode/skills/` can contain repo-specific reusable skills worth committing.
- Local AI-tool scratch files, worktrees, plans, and state should stay ignored.
- This project is local-first today, but its contracts are meant to stay usable by future hosted, macOS, iOS, and Android clients.
