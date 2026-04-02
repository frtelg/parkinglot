import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const workspaceRoot = path.resolve(import.meta.dirname, "..");

let serverProcess;
let baseUrl;
let tempDirectory;

async function getAvailablePort() {
  const server = createServer();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Unable to determine test port");
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  return address.port;
}

async function waitForServer(url, child) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 60000) {
    if (child.exitCode !== null) {
      throw new Error(`Next server exited early with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(`${url}/api/items?view=active`);

      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the dev server is ready.
    }

    await delay(500);
  }

  throw new Error("Timed out waiting for Next server to start");
}

async function api(pathname, init) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const payload = await response.json();

  return {
    status: response.status,
    payload,
  };
}

before(async () => {
  tempDirectory = await mkdtemp(path.join(os.tmpdir(), "parkinglot-tests-"));
  const port = await getAvailablePort();
  const databasePath = path.join(tempDirectory, "parkinglot.db");

  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        PARKINGLOT_DB_PATH: databasePath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let stderr = "";

  serverProcess.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(baseUrl, serverProcess);
  } catch (error) {
    serverProcess.kill("SIGTERM");
    throw new Error(`${error instanceof Error ? error.message : "Server failed to start"}\n${stderr}`);
  }
});

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => serverProcess.once("exit", resolve)),
      delay(5000),
    ]);
  }

  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("lifecycle views keep items in the correct collections", async () => {
  const createResponse = await api("/api/items", {
    method: "POST",
    body: JSON.stringify({
      title: `Lifecycle item ${Date.now()}`,
      details: "Track state transitions through the API",
    }),
  });

  assert.equal(createResponse.status, 201);
  const itemId = createResponse.payload.item.id;

  const activeView = await api("/api/items?view=active");
  assert.equal(activeView.status, 200);
  assert.ok(activeView.payload.items.some((item) => item.id === itemId));

  const resolveResponse = await api(`/api/items/${itemId}/resolve`, { method: "POST" });
  assert.equal(resolveResponse.status, 200);
  assert.equal(resolveResponse.payload.item.status, "resolved");

  const activeAfterResolve = await api("/api/items?view=active");
  assert.ok(activeAfterResolve.payload.items.every((item) => item.id !== itemId));

  const resolvedView = await api("/api/items?view=resolved");
  assert.ok(resolvedView.payload.items.some((item) => item.id === itemId));

  const archiveResponse = await api(`/api/items/${itemId}/archive`, { method: "POST" });
  assert.equal(archiveResponse.status, 200);
  assert.ok(archiveResponse.payload.item.archivedAt);

  const archivedView = await api("/api/items?view=archived");
  assert.ok(archivedView.payload.items.some((item) => item.id === itemId));

  const unarchiveResponse = await api(`/api/items/${itemId}/unarchive`, { method: "POST" });
  assert.equal(unarchiveResponse.status, 200);
  assert.equal(unarchiveResponse.payload.item.status, "resolved");
  assert.equal(unarchiveResponse.payload.item.archivedAt, null);

  const resolvedAfterUnarchive = await api("/api/items?view=resolved");
  assert.ok(resolvedAfterUnarchive.payload.items.some((item) => item.id === itemId));
});

test("comments can be created, edited, listed chronologically, and soft-deleted", async () => {
  const createItemResponse = await api("/api/items", {
    method: "POST",
    body: JSON.stringify({
      title: `Comment item ${Date.now()}`,
      details: "Track discussion on one item",
    }),
  });

  const itemId = createItemResponse.payload.item.id;

  const firstCommentResponse = await api(`/api/items/${itemId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body: "First note",
      authorType: "human",
      authorLabel: "Franke",
    }),
  });

  assert.equal(firstCommentResponse.status, 201);
  const firstCommentId = firstCommentResponse.payload.comment.id;
  assert.equal(firstCommentResponse.payload.comment.authorType, "human");
  assert.equal(firstCommentResponse.payload.comment.authorLabel, "Franke");

  await delay(20);

  const secondCommentResponse = await api(`/api/items/${itemId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body: "Second note",
      authorType: "agent",
      authorLabel: "Planner Bot",
    }),
  });

  assert.equal(secondCommentResponse.status, 201);
  const secondCommentId = secondCommentResponse.payload.comment.id;

  const updateCommentResponse = await api(`/api/items/${itemId}/comments/${firstCommentId}`, {
    method: "PATCH",
    body: JSON.stringify({ body: "First note, clarified" }),
  });

  assert.equal(updateCommentResponse.status, 200);
  assert.equal(updateCommentResponse.payload.comment.body, "First note, clarified");

  const detailBeforeDelete = await api(`/api/items/${itemId}`);
  assert.equal(detailBeforeDelete.status, 200);
  assert.deepEqual(
    detailBeforeDelete.payload.comments.map((comment) => comment.id),
    [firstCommentId, secondCommentId],
  );

  const deleteCommentResponse = await api(`/api/items/${itemId}/comments/${secondCommentId}`, {
    method: "DELETE",
  });

  assert.equal(deleteCommentResponse.status, 200);
  assert.ok(deleteCommentResponse.payload.comment.deletedAt);

  const detailAfterDelete = await api(`/api/items/${itemId}`);
  assert.equal(detailAfterDelete.status, 200);
  assert.deepEqual(
    detailAfterDelete.payload.comments.map((comment) => comment.id),
    [firstCommentId],
  );
  assert.equal(detailAfterDelete.payload.comments[0].body, "First note, clarified");

  const deletedCommentUpdate = await api(`/api/items/${itemId}/comments/${secondCommentId}`, {
    method: "PATCH",
    body: JSON.stringify({ body: "Should fail" }),
  });

  assert.equal(deletedCommentUpdate.status, 409);
});

test("comment activity bumps the item to the top of the active view", async () => {
  const firstItemResponse = await api("/api/items", {
    method: "POST",
    body: JSON.stringify({
      title: `Older item ${Date.now()}`,
      details: "Created first",
    }),
  });

  await delay(20);

  const secondItemResponse = await api("/api/items", {
    method: "POST",
    body: JSON.stringify({
      title: `Newer item ${Date.now()}`,
      details: "Created second",
    }),
  });

  const firstItemId = firstItemResponse.payload.item.id;
  const secondItemId = secondItemResponse.payload.item.id;

  const initialActiveView = await api("/api/items?view=active");
  const initialOrder = initialActiveView.payload.items.map((item) => item.id);
  assert.ok(initialOrder.indexOf(secondItemId) < initialOrder.indexOf(firstItemId));

  await delay(20);

  const commentResponse = await api(`/api/items/${firstItemId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body: "Fresh activity should move this item up",
      authorType: "system",
    }),
  });

  assert.equal(commentResponse.status, 201);

  const refreshedActiveView = await api("/api/items?view=active");
  assert.equal(refreshedActiveView.payload.items[0].id, firstItemId);
  assert.ok(refreshedActiveView.payload.items.some((item) => item.id === secondItemId));
});

test("concurrent local clients can append comments without corrupting the timeline", async () => {
  const createItemResponse = await api("/api/items", {
    method: "POST",
    body: JSON.stringify({
      title: `Concurrent item ${Date.now()}`,
      details: "Exercise local multi-window writes",
    }),
  });

  const itemId = createItemResponse.payload.item.id;

  const commentBodies = [
    "Window A leaves context",
    "Window B adds an update",
    "Window C records a blocker",
    "Window D confirms the next step",
  ];

  const responses = await Promise.all(
    commentBodies.map((body, index) =>
      api(`/api/items/${itemId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          body,
          authorType: index % 2 === 0 ? "human" : "agent",
          authorLabel: `Client ${index + 1}`,
        }),
      }),
    ),
  );

  for (const response of responses) {
    assert.equal(response.status, 201);
  }

  const detailResponse = await api(`/api/items/${itemId}`);
  assert.equal(detailResponse.status, 200);
  assert.equal(detailResponse.payload.comments.length, commentBodies.length);
  assert.deepEqual(
    [...detailResponse.payload.comments].map((comment) => comment.body).sort(),
    [...commentBodies].sort(),
  );
});
