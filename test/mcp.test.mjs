import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";

let tempDirectory;
let databasePath;

function encodeMessage(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;
}

function createSession() {
  const child = spawn(process.execPath, ["scripts/parking-lot-mcp.mjs"], {
    cwd: path.resolve(import.meta.dirname, ".."),
    env: {
      ...process.env,
      PARKINGLOT_DB_PATH: databasePath,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdoutBuffer = Buffer.alloc(0);
  let stderr = "";
  let nextId = 1;
  const pending = new Map();

  child.stdout.on("data", (chunk) => {
    stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);

    while (true) {
      const separatorIndex = stdoutBuffer.indexOf("\r\n\r\n");
      if (separatorIndex === -1) {
        break;
      }

      const headerText = stdoutBuffer.subarray(0, separatorIndex).toString("utf8");
      const match = headerText.match(/Content-Length:\s*(\d+)/i);
      assert.ok(match, `Missing Content-Length header in: ${headerText}`);

      const bodyLength = Number.parseInt(match[1], 10);
      const bodyStart = separatorIndex + 4;
      const bodyEnd = bodyStart + bodyLength;
      if (stdoutBuffer.length < bodyEnd) {
        break;
      }

      const body = stdoutBuffer.subarray(bodyStart, bodyEnd).toString("utf8");
      stdoutBuffer = stdoutBuffer.subarray(bodyEnd);

      const message = JSON.parse(body);
      const pendingRequest = pending.get(message.id);
      if (pendingRequest) {
        pending.delete(message.id);
        pendingRequest.resolve(message);
      }
    }
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.on("exit", (code) => {
    if (code === 0) {
      return;
    }

    const error = new Error(stderr || `MCP process exited with code ${code}`);
    for (const pendingRequest of pending.values()) {
      pendingRequest.reject(error);
    }
    pending.clear();
  });

  return {
    async request(method, params) {
      const id = nextId++;
      const responsePromise = new Promise((resolve, reject) => {
        pending.set(id, {
          resolve(message) {
            if (message.error) {
              reject(new Error(message.error.message));
              return;
            }

            resolve(message.result);
          },
          reject,
        });
      });

      child.stdin.write(encodeMessage({ jsonrpc: "2.0", id, method, params }));
      return responsePromise;
    },
    notify(method, params) {
      child.stdin.write(encodeMessage({ jsonrpc: "2.0", method, params }));
    },
    async close() {
      if (child.exitCode !== null) {
        return;
      }

      child.stdin.end();
      await new Promise((resolve) => child.once("exit", resolve));
    },
  };
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

test("mcp adapter initializes and lists tools", async () => {
  const session = createSession();

  try {
    const initialized = await session.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "node-test",
        version: "1.0.0",
      },
    });

    assert.equal(initialized.protocolVersion, "2024-11-05");
    assert.equal(initialized.serverInfo.name, "parking-lot-mcp");

    session.notify("notifications/initialized");

    const tools = await session.request("tools/list");
    assert.ok(Array.isArray(tools.tools));
    assert.ok(tools.tools.some((tool) => tool.name === "list_items"));
    assert.ok(tools.tools.some((tool) => tool.name === "create_comment"));
  } finally {
    await session.close();
  }
});

test("mcp adapter uses the shared item and comment semantics", async () => {
  const session = createSession();

  try {
    await session.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "node-test",
        version: "1.0.0",
      },
    });
    session.notify("notifications/initialized");

    const createdItem = await session.request("tools/call", {
      name: "create_item",
      arguments: {
        title: "MCP created item",
        details: "Created through the MCP adapter",
      },
    });

    const itemId = createdItem.structuredContent.item.id;

    const createdComment = await session.request("tools/call", {
      name: "create_comment",
      arguments: {
        itemId,
        body: "Created through the MCP adapter",
        authorType: "agent",
        authorLabel: "Claude Code",
      },
    });

    assert.equal(createdComment.structuredContent.comment.itemId, itemId);

    const detail = await session.request("tools/call", {
      name: "get_item",
      arguments: {
        id: itemId,
      },
    });

    assert.equal(detail.structuredContent.item.id, itemId);
    assert.equal(detail.structuredContent.comments.length, 1);
    assert.equal(detail.structuredContent.comments[0].body, "Created through the MCP adapter");

    const resolved = await session.request("tools/call", {
      name: "resolve_item",
      arguments: {
        id: itemId,
      },
    });

    assert.equal(resolved.structuredContent.item.status, "resolved");
  } finally {
    await session.close();
  }
});
