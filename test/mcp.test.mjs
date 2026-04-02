import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";

let tempDirectory;
let databasePath;

function runMcp(request) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/parking-lot-mcp.mjs"], {
      cwd: path.resolve(import.meta.dirname, ".."),
      env: {
        ...process.env,
        PARKINGLOT_DB_PATH: databasePath,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `MCP process exited with code ${code}`));
        return;
      }

      resolve(JSON.parse(stdout));
    });

    child.stdin.end(request ? JSON.stringify(request) : "");
  });
}

before(async () => {
  tempDirectory = await mkdtemp(path.join(os.tmpdir(), "parkinglot-mcp-tests-"));
  databasePath = path.join(tempDirectory, "parkinglot.db");
});

after(async () => {
  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("mcp adapter lists tools", async () => {
  const response = await runMcp({ method: "tools/list" });

  assert.ok(Array.isArray(response.tools));
  assert.ok(response.tools.some((tool) => tool.name === "list_items"));
  assert.ok(response.tools.some((tool) => tool.name === "create_comment"));
});

test("mcp adapter uses the shared item and comment semantics", async () => {
  const createdItem = await runMcp({
    method: "tools/call",
    params: {
      name: "create_item",
      arguments: {
        title: "MCP created item",
        details: "Created through the MCP adapter",
      },
    },
  });

  const itemId = createdItem.structuredContent.item.id;

  const createdComment = await runMcp({
    method: "tools/call",
    params: {
      name: "create_comment",
      arguments: {
        itemId,
        body: "Created through the MCP adapter",
        authorType: "agent",
        authorLabel: "Claude Code",
      },
    },
  });

  assert.equal(createdComment.structuredContent.comment.itemId, itemId);

  const detail = await runMcp({
    method: "tools/call",
    params: {
      name: "get_item",
      arguments: {
        id: itemId,
      },
    },
  });

  assert.equal(detail.structuredContent.item.id, itemId);
  assert.equal(detail.structuredContent.comments.length, 1);
  assert.equal(detail.structuredContent.comments[0].body, "Created through the MCP adapter");

  const resolved = await runMcp({
    method: "tools/call",
    params: {
      name: "resolve_item",
      arguments: {
        id: itemId,
      },
    },
  });

  assert.equal(resolved.structuredContent.item.status, "resolved");
});
