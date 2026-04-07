---
name: parking-lot-tool
description: Read, create, update, resolve, archive, unarchive, and comment on local parking lot items through the repo's shared REST and MCP contracts.
targets: [claude, opencode, codex]
license: MIT
metadata:
  author: parkinglot
  version: 1.0.0
---

# Parking Lot Tool

Use this skill to interact with the local parking lot application without re-deriving its behavior from UI code.

The app is local-first and stores data in SQLite. The canonical business semantics are shared across:

- the web UI
- the REST API
- the local MCP adapter

## When to Use

Use this skill when the user:
- asks to inspect current work in the parking lot
- wants to create, update, resolve, archive, or unarchive an item
- wants to add, edit, or remove a comment on an item
- wants the parking lot accessed through REST or MCP instead of the browser UI

Do NOT use this skill for:
- unrelated project work that does not involve parking lot items or comments
- destructive item deletion workflows, because v1 does not support hard-delete

## Instructions

### Step 1: Gather Context

- Confirm the app is running locally if you plan to use REST.
- Decide whether REST or MCP is the better transport for the current runtime.
- If the user refers to an existing item, identify it by item ID before mutating it.

### Step 2: Execute

Prefer REST when direct HTTP access is available.

REST operations:

- List items: `GET /api/items?view=active|resolved|archived`
- Get item detail: `GET /api/items/<id>`
- Create item: `POST /api/items`
- Update item: `PATCH /api/items/<id>`
- Resolve item: `POST /api/items/<id>/resolve`
- Archive item: `POST /api/items/<id>/archive`
- Unarchive item: `POST /api/items/<id>/unarchive`
- Create comment: `POST /api/items/<id>/comments`
- Update comment: `PATCH /api/items/<id>/comments/<commentId>`
- Delete comment: `DELETE /api/items/<id>/comments/<commentId>`

Prefer MCP when the runtime expects tool transport.

MCP entrypoint:

- `npm run mcp`

MCP methods:

- `initialize`
- `notifications/initialized`
- `tools/list`
- `tools/call`

The server uses framed stdio MCP transport with `Content-Length` headers rather than one-shot plain JSON on stdin.

Supported MCP tool names:

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

Behavior rules:

- Items are never hard-deleted in v1.
- Comments are soft-deleted and removed from the normal timeline.
- Unarchiving restores the previous non-archived working state.
- Comment activity updates the item timestamp, which can change active ordering.

### Step 3: Validate

- For reads, return the structured result from REST or MCP directly.
- For writes, verify the updated item or comment object in the response.
- If comments are involved, confirm the item detail timeline reflects the expected chronological state.
- If lifecycle changed, confirm the item appears in the correct view.

## Examples

**Example:** Review active work
User says: "Show me what is active in the parking lot."
Actions:
1. Call `GET /api/items?view=active` or MCP `list_items` with `view=active`.
2. Return the structured item list.
Result: The user sees current active items ordered by recent activity.

**Example:** Leave agent context on an item
User says: "Add a note to item `<id>` saying the API tests are green."
Actions:
1. Create a comment with `authorType: agent`.
2. Return the created comment.
3. Optionally fetch the item detail if the user wants the updated timeline.
Result: The item gains comment context without changing any other semantics.

## Troubleshooting

**Error:** `Item <id> was not found`
**Cause:** The item ID is wrong or no longer exists in the local database.
**Solution:** List the relevant view first and retry with the correct ID.

**Error:** `Comment <id> has already been deleted`
**Cause:** A soft-deleted comment was edited again.
**Solution:** Create a new comment instead of updating the deleted one.

**Error:** connection or fetch failure
**Cause:** The local Next app is not running for REST access.
**Solution:** Start it with `npm run dev`, or switch to the MCP adapter if appropriate.
