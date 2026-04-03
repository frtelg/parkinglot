import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createIsolatedRuntime, createRouteContext, readJson, readStreamChunk } from "./helpers/isolated-runtime";

async function withMockedNow(values: string[], run: () => Promise<void> | void) {
  const OriginalDate = Date;
  let index = 0;

  class MockDate extends OriginalDate {
    constructor(value?: string | number | Date) {
      super(value ?? values[Math.min(index, values.length - 1)]);
    }

    static override now() {
      return new OriginalDate(values[Math.min(index, values.length - 1)]).valueOf();
    }
  }

  const originalToISOString = OriginalDate.prototype.toISOString;
  MockDate.prototype.toISOString = function toISOString() {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value ?? originalToISOString.call(this);
  };

  globalThis.Date = MockDate as DateConstructor;

  try {
    await run();
  } finally {
    globalThis.Date = OriginalDate;
  }
}

describe("route exports", () => {
  let cleanup: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    await cleanup?.();
    cleanup = (await createIsolatedRuntime()).cleanup;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await cleanup?.();
    cleanup = undefined;
  });

  test("item collection route handles list and create flows", async () => {
    const route = await import("@/app/api/items/route");

    expect(route.dynamic).toBe("force-dynamic");

    const createResponse = await route.POST(
      new NextRequest("http://localhost/api/items", {
        method: "POST",
        body: JSON.stringify({ title: "Route item", details: "Created through route" }),
      }),
    );
    expect(createResponse.status).toBe(201);

    const listResponse = await route.GET(new NextRequest("http://localhost/api/items?view=active"));
    expect(listResponse.status).toBe(200);
    const listPayload = (await readJson(listResponse)) as { items: Array<{ title: string }> };
    expect(listPayload.items[0]?.title).toBe("Route item");

    const defaultListResponse = await route.GET(new NextRequest("http://localhost/api/items"));
    expect(defaultListResponse.status).toBe(200);

    const invalidResponse = await route.GET(new NextRequest("http://localhost/api/items?view=unknown"));
    expect(invalidResponse.status).toBe(400);

    const invalidCreateResponse = await route.POST(
      new NextRequest("http://localhost/api/items", {
        method: "POST",
        body: JSON.stringify({ title: "   " }),
      }),
    );
    expect(invalidCreateResponse.status).toBe(400);
  });

  test("item detail route handles get, patch, and not found paths", async () => {
    const service = await import("@/lib/parking-lot");
    const route = await import("@/app/api/items/[id]/route");
    const created = service.createParkingLotItem({ title: "Detail item", details: "Detail flow" });

    expect(route.dynamic).toBe("force-dynamic");

    const getResponse = await route.GET(
      new Request("http://localhost/api/items/id") as never,
      createRouteContext({ id: created.item.id }),
    );
    expect(getResponse.status).toBe(200);

    const patchResponse = await route.PATCH(
      new Request("http://localhost/api/items/id", {
        method: "PATCH",
        body: JSON.stringify({ details: "Updated detail flow" }),
      }) as never,
      createRouteContext({ id: created.item.id }),
    );
    expect((await readJson(patchResponse) as { item: { details: string } }).item.details).toBe("Updated detail flow");

    const invalidPatchResponse = await route.PATCH(
      new Request("http://localhost/api/items/id", {
        method: "PATCH",
        body: JSON.stringify({ title: "   " }),
      }) as never,
      createRouteContext({ id: created.item.id }),
    );
    expect(invalidPatchResponse.status).toBe(400);

    const missingResponse = await route.GET(
      new Request("http://localhost/api/items/missing") as never,
      createRouteContext({ id: "00000000-0000-0000-0000-000000000000" }),
    );
    expect(missingResponse.status).toBe(404);
  });

  test("comment and lifecycle routes handle success and error responses", async () => {
    const service = await import("@/lib/parking-lot");
    const commentsRoute = await import("@/app/api/items/[id]/comments/route");
    const commentRoute = await import("@/app/api/items/[id]/comments/[commentId]/route");
    const reorderRoute = await import("@/app/api/items/reorder/route");
    const resolveRoute = await import("@/app/api/items/[id]/resolve/route");
    const archiveRoute = await import("@/app/api/items/[id]/archive/route");
    const unarchiveRoute = await import("@/app/api/items/[id]/unarchive/route");

    const created = service.createParkingLotItem({ title: "Route lifecycle item", details: "Lifecycle flow" });
    const secondActive = service.createParkingLotItem({ title: "Second route item", details: "Reorder flow" });
    const itemId = created.item.id;

    expect(commentsRoute.dynamic).toBe("force-dynamic");
    expect(commentRoute.dynamic).toBe("force-dynamic");
    expect(reorderRoute.dynamic).toBe("force-dynamic");
    expect(resolveRoute.dynamic).toBe("force-dynamic");
    expect(archiveRoute.dynamic).toBe("force-dynamic");
    expect(unarchiveRoute.dynamic).toBe("force-dynamic");

    const reorderResponse = await reorderRoute.POST(
      new NextRequest("http://localhost/api/items/reorder", {
        method: "POST",
        body: JSON.stringify({ itemIds: [secondActive.item.id, itemId] }),
      }),
    );
    expect(((await readJson(reorderResponse)) as { items: Array<{ id: string }> }).items.map((item) => item.id)).toEqual([
      secondActive.item.id,
      itemId,
    ]);

    const invalidReorderResponse = await reorderRoute.POST(
      new NextRequest("http://localhost/api/items/reorder", {
        method: "POST",
        body: JSON.stringify({ itemIds: [itemId] }),
      }),
    );
    expect(invalidReorderResponse.status).toBe(409);

    let resolvedEarlierId = "";
    let resolvedLaterId = "";

    await withMockedNow(
      [
        "2026-04-03T10:00:00.000Z",
        "2026-04-03T11:00:00.000Z",
        "2026-04-03T12:00:00.000Z",
        "2026-04-03T13:00:00.000Z",
      ],
      async () => {
        const resolvedEarlier = service.createParkingLotItem({ title: "Resolved earlier", details: "Earlier timestamp" });
        const resolvedLater = service.createParkingLotItem({ title: "Resolved later", details: "Later timestamp" });
        service.resolveParkingLotItem(resolvedEarlier.item.id);
        service.resolveParkingLotItem(resolvedLater.item.id);
        resolvedEarlierId = resolvedEarlier.item.id;
        resolvedLaterId = resolvedLater.item.id;
      },
    );

    const resolvedListResponse = await (await import("@/app/api/items/route")).GET(
      new NextRequest("http://localhost/api/items?view=resolved"),
    );
    const resolvedIds = ((await readJson(resolvedListResponse)) as { items: Array<{ id: string }> }).items.map((item) => item.id);
    expect(resolvedIds.indexOf(resolvedLaterId)).toBeLessThan(resolvedIds.indexOf(resolvedEarlierId));

    const createdCommentResponse = await commentsRoute.POST(
      new Request("http://localhost/api/items/id/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Route comment", authorType: "human", authorLabel: "Franke" }),
      }) as never,
      createRouteContext({ id: itemId }),
    );
    expect(createdCommentResponse.status).toBe(201);
    const commentId = ((await readJson(createdCommentResponse)) as { comment: { id: string } }).comment.id;

    const patchedCommentResponse = await commentRoute.PATCH(
      new Request("http://localhost/api/items/id/comments/comment", {
        method: "PATCH",
        body: JSON.stringify({ body: "Updated route comment" }),
      }) as never,
      createRouteContext({ id: itemId, commentId }),
    );
    expect(((await readJson(patchedCommentResponse)) as { comment: { body: string } }).comment.body).toBe(
      "Updated route comment",
    );

    const deleteCommentResponse = await commentRoute.DELETE(
      new Request("http://localhost/api/items/id/comments/comment", { method: "DELETE" }) as never,
      createRouteContext({ id: itemId, commentId }),
    );
    expect(((await readJson(deleteCommentResponse)) as { comment: { deletedAt: string | null } }).comment.deletedAt).not.toBeNull();

    const deletedPatchResponse = await commentRoute.PATCH(
      new Request("http://localhost/api/items/id/comments/comment", {
        method: "PATCH",
        body: JSON.stringify({ body: "Should fail" }),
      }) as never,
      createRouteContext({ id: itemId, commentId }),
    );
    expect(deletedPatchResponse.status).toBe(409);

    const missingDeleteCommentResponse = await commentRoute.DELETE(
      new Request("http://localhost/api/items/id/comments/comment", { method: "DELETE" }) as never,
      createRouteContext({ id: itemId, commentId: "00000000-0000-0000-0000-000000000000" }),
    );
    expect(missingDeleteCommentResponse.status).toBe(404);

    const invalidCreateCommentResponse = await commentsRoute.POST(
      new Request("http://localhost/api/items/id/comments", {
        method: "POST",
        body: JSON.stringify({ body: "", authorType: "human" }),
      }) as never,
      createRouteContext({ id: itemId }),
    );
    expect(invalidCreateCommentResponse.status).toBe(400);

    const invalidUpdateCommentResponse = await commentRoute.PATCH(
      new Request("http://localhost/api/items/id/comments/comment", {
        method: "PATCH",
        body: JSON.stringify({ body: "" }),
      }) as never,
      createRouteContext({ id: itemId, commentId }),
    );
    expect(invalidUpdateCommentResponse.status).toBe(400);

    const resolveResponse = await resolveRoute.POST(
      new Request("http://localhost/api/items/id/resolve", { method: "POST" }) as never,
      createRouteContext({ id: itemId }),
    );
    expect(((await readJson(resolveResponse)) as { item: { status: string } }).item.status).toBe("resolved");

    const archiveResponse = await archiveRoute.POST(
      new Request("http://localhost/api/items/id/archive", { method: "POST" }) as never,
      createRouteContext({ id: itemId }),
    );
    expect(((await readJson(archiveResponse)) as { item: { archivedAt: string | null } }).item.archivedAt).not.toBeNull();

    const unarchiveResponse = await unarchiveRoute.POST(
      new Request("http://localhost/api/items/id/unarchive", { method: "POST" }) as never,
      createRouteContext({ id: itemId }),
    );
    expect(((await readJson(unarchiveResponse)) as { item: { archivedAt: string | null } }).item.archivedAt).toBeNull();

    const missingArchiveResponse = await archiveRoute.POST(
      new Request("http://localhost/api/items/id/archive", { method: "POST" }) as never,
      createRouteContext({ id: "00000000-0000-0000-0000-000000000000" }),
    );
    expect(missingArchiveResponse.status).toBe(404);

    const missingResolveResponse = await resolveRoute.POST(
      new Request("http://localhost/api/items/id/resolve", { method: "POST" }) as never,
      createRouteContext({ id: "00000000-0000-0000-0000-000000000000" }),
    );
    expect(missingResolveResponse.status).toBe(404);

    const missingUnarchiveResponse = await unarchiveRoute.POST(
      new Request("http://localhost/api/items/id/unarchive", { method: "POST" }) as never,
      createRouteContext({ id: "00000000-0000-0000-0000-000000000000" }),
    );
    expect(missingUnarchiveResponse.status).toBe(404);
  });

  test("event route emits ready and item-created server-sent events", async () => {
    vi.useFakeTimers();

    const abortController = new AbortController();
    const route = await import("@/app/api/items/events/route");
    const events = await import("@/lib/item-events");

    expect(route.dynamic).toBe("force-dynamic");

    const response = await route.GET(
      new Request("http://localhost/api/items/events", { signal: abortController.signal }) as never,
    );

    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache, no-transform");
    expect(response.headers.get("Connection")).toBe("keep-alive");

    const reader = response.body?.getReader();
    expect(reader).toBeTruthy();

    const readyChunk = await readStreamChunk(reader!);
    expect(readyChunk.text).toContain("event: ready");
    expect(readyChunk.text).toContain('{"ok":true}');

    events.publishItemCreatedEvent({
      itemId: "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
      view: "active",
    });
    const createdChunk = await readStreamChunk(reader!);
    expect(createdChunk.text).toContain("event: item-created");
    expect(createdChunk.text).toContain("0df048cf-b2f8-46f9-9a0f-6fbec60b39a2");

    const keepAlivePromise = readStreamChunk(reader!);
    await vi.advanceTimersByTimeAsync(15000);
    const keepAliveChunk = await keepAlivePromise;
    expect(keepAliveChunk.text).toContain(": keep-alive");

    abortController.abort();
    await expect(reader!.read()).resolves.toMatchObject({ done: true });
  });
});
