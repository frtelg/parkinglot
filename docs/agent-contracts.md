# Agent Contracts

This document describes the shared item and comment workflows used by the web UI, REST API, and MCP adapter.

## Shared Core

The canonical service layer lives in `src/lib/parking-lot.ts`.

It exposes shared operations for:

- listing items by lifecycle view
- reading an item with its comment timeline
- creating and updating items
- resolving, archiving, and unarchiving items
- creating, editing, and soft-deleting comments

The canonical response contracts live in `src/lib/contracts.ts`.

## Workflow Definitions

### Read current work

1. List a lifecycle view.
2. Fetch item detail when timeline context is needed.
3. Return the structured response without changing semantics.

### Create or update an item

1. Create with `title` and optional `details`, or patch an existing item.
2. Return the updated item object.

### Resolve, archive, and unarchive

1. Resolve changes the working state to `resolved`.
2. Archive sets archive metadata but preserves item and comment history.
3. Unarchive clears archive metadata and preserves the prior working state.

### Comment on an item

1. Create with `body`, `authorType`, and optional `authorLabel`.
2. Edit by updating `body` only.
3. Delete by soft-deleting the existing comment record.

## REST Mapping

- `GET /api/items?view=...`
- `GET /api/items/:id`
- `POST /api/items`
- `PATCH /api/items/:id`
- `POST /api/items/:id/resolve`
- `POST /api/items/:id/archive`
- `POST /api/items/:id/unarchive`
- `POST /api/items/:id/comments`
- `PATCH /api/items/:id/comments/:commentId`
- `DELETE /api/items/:id/comments/:commentId`

## MCP Mapping

The local MCP adapter exposes tool names with one-to-one mapping to the shared service layer:

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

## Compatibility Goal

Future hosted and native clients should reuse these contracts rather than depending on React component behavior or Next.js route internals.
