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

The repo includes a simple local MCP-style adapter that exposes the same item and comment operations through tool calls.

List tools:

```bash
npm run mcp
```

Call a tool:

```bash
printf '%s' '{"method":"tools/call","params":{"name":"list_items","arguments":{"view":"active"}}}' | npm run mcp
```

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
- OpenCode repo skill: `.opencode/skills/parking-lot-agent/SKILL.md`

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
