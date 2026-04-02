---
name: parking-lot-agent
description: Read, create, update, resolve, archive, unarchive, and comment on local parking lot items through the shared REST or MCP contracts.
license: MIT
compatibility: Local repo with the parking lot app running.
metadata:
  author: parkinglot
  version: "1.0"
---

Use this workflow when an agent needs structured access to local parking lot items.

## Defaults

- Read and write operations are allowed by default in this local repo.
- Prefer the shared REST API when HTTP access is available.
- Use the MCP adapter when the agent runtime requires tool transport.
- Apply the same semantics the web UI uses: no hard-delete for items, comments are soft-deleted, and archived items preserve their previous working state.

## REST Operations

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

## MCP Operations

Run `node scripts/parking-lot-mcp.mjs`.

- With no stdin payload, it prints the available tools.
- With a JSON request on stdin, it supports:
  - `{"method":"tools/list"}`
  - `{"method":"tools/call","params":{"name":"list_items","arguments":{"view":"active"}}}`

## Common Workflows

### Read current active work

1. List active items.
2. If needed, fetch one item detail to inspect comments.
3. Return structured results, not paraphrased guesses.

### Create or update an item

1. Create the item with `title` and optional `details`, or patch an existing item.
2. Return the updated item object.

### Move work through lifecycle

1. Resolve when the item is finished.
2. Archive when it should leave the active or resolved flow.
3. Unarchive to restore the prior active or resolved state.

### Add item context

1. Create a comment with `body`, `authorType`, and optional `authorLabel`.
2. Edit comments when wording should change.
3. Soft-delete comments instead of destroying history.

## Response Guidance

- Prefer returning the structured API or MCP result verbatim.
- When a write succeeds, include the updated item or comment object.
- When a read succeeds, include comments in chronological order.
- When an error occurs, surface the exact API or tool error.
