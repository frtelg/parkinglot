import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ZodError } from "zod";

import { createIsolatedRuntime } from "./helpers/isolated-runtime";

describe("service, errors, events, and MCP exports", () => {
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

  test("parking lot service exports wrap item and comment behavior", async () => {
    const parkingLot = await import("@/lib/parking-lot");

    const created = parkingLot.createParkingLotItem({
      title: "Service item",
      details: "Created through service",
    });
    expect(created.item.title).toBe("Service item");

    expect(parkingLot.listParkingLotItems("active").items.map((item) => item.id)).toContain(created.item.id);

    const detail = parkingLot.getParkingLotItemDetail(created.item.id);
    expect(detail.item.id).toBe(created.item.id);
    expect(() => parkingLot.getParkingLotItemDetail("missing")).toThrow();

    const updated = parkingLot.updateParkingLotItem(created.item.id, { details: "Updated by service" });
    expect(updated.item.details).toBe("Updated by service");

    const createdComment = parkingLot.createParkingLotComment(created.item.id, {
      body: "Service comment",
      authorType: "agent",
      authorLabel: "Planner",
    });
    expect(createdComment.comment.authorLabel).toBe("Planner");

    const updatedComment = parkingLot.updateParkingLotComment(created.item.id, createdComment.comment.id, {
      body: "Updated service comment",
    });
    expect(updatedComment.comment.body).toBe("Updated service comment");

    const deletedComment = parkingLot.deleteParkingLotComment(created.item.id, createdComment.comment.id);
    expect(deletedComment.comment.deletedAt).not.toBeNull();

    expect(parkingLot.resolveParkingLotItem(created.item.id).item.status).toBe("resolved");
    expect(parkingLot.archiveParkingLotItem(created.item.id).item.archivedAt).not.toBeNull();
    expect(parkingLot.unarchiveParkingLotItem(created.item.id).item.archivedAt).toBeNull();
  });

  test("item event exports publish and unsubscribe listeners", async () => {
    const events = await import("@/lib/item-events");
    const listener = vi.fn();
    const unsubscribe = events.subscribeToItemEvents(listener);

    events.publishItemCreatedEvent({
      itemId: "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
      view: "active",
    });
    expect(listener).toHaveBeenCalledWith({
      type: "item-created",
      itemId: "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
      view: "active",
    });

    unsubscribe();
    events.publishItemCreatedEvent({
      itemId: "b05e453d-23f1-422b-b798-65c9d07867f5",
      view: "resolved",
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("route error handler maps known and unknown errors", async () => {
    const { CommentNotFoundError, DeletedCommentError } = await import("@/lib/comments");
    const { ItemNotFoundError } = await import("@/lib/items");
    const { handleRouteError } = await import("@/lib/api-errors");

    const validationError = new ZodError([
      {
        code: "custom",
        path: ["title"],
        message: "Title is required",
      },
    ]);
    const unknownSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const validationResponse = handleRouteError(validationError);
    expect(validationResponse.status).toBe(400);
    expect(await validationResponse.json()).toEqual({ error: "Title is required" });

    const itemResponse = handleRouteError(new ItemNotFoundError("missing-item"));
    expect(itemResponse.status).toBe(404);

    const commentResponse = handleRouteError(new CommentNotFoundError("missing-comment"));
    expect(commentResponse.status).toBe(404);

    const deletedResponse = handleRouteError(new DeletedCommentError("deleted-comment"));
    expect(deletedResponse.status).toBe(409);

    const unknownResponse = handleRouteError(new Error("boom"));
    expect(unknownResponse.status).toBe(500);
    expect(await unknownResponse.json()).toEqual({ error: "Internal server error" });
    expect(unknownSpy).toHaveBeenCalled();
  });

  test("database export prefers explicit PARKINGLOT_DB_PATH", async () => {
    const runtime = await createIsolatedRuntime();

    try {
      const overriddenPath = `${runtime.databasePath}.override`;
      process.env.PARKINGLOT_DB_PATH = overriddenPath;
      vi.resetModules();

      const databaseModule = await import("@/lib/database");
      expect(databaseModule.databasePath).toBe(overriddenPath);
    } finally {
      await runtime.cleanup();
    }
  });

  test("MCP exports list tools and dispatch supported operations", async () => {
    const mcp = await import("@/lib/mcp-server");

    const tools = mcp.listMcpTools();
    expect(tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        "list_items",
        "get_item",
        "create_item",
        "update_item",
        "resolve_item",
        "archive_item",
        "unarchive_item",
        "create_comment",
        "update_comment",
        "delete_comment",
      ]),
    );

    const createdItem = mcp.callMcpTool("create_item", {
      title: "MCP item",
      details: "created from tests",
    });
    const itemId = (createdItem.structuredContent as { item: { id: string } }).item.id;

    expect(mcp.callMcpTool("list_items", { view: "active" }).content[0]?.text).toContain("MCP item");
    expect((mcp.callMcpTool("get_item", { id: itemId }).structuredContent as { item: { id: string } }).item.id).toBe(itemId);

    const updated = mcp.callMcpTool("update_item", { id: itemId, title: "Updated MCP item" });
    expect((updated.structuredContent as { item: { title: string } }).item.title).toBe("Updated MCP item");

    const createdComment = mcp.callMcpTool("create_comment", {
      itemId,
      body: "From MCP",
      authorType: "system",
    });
    const commentId = (createdComment.structuredContent as { comment: { id: string } }).comment.id;

    const updatedComment = mcp.callMcpTool("update_comment", {
      itemId,
      commentId,
      body: "Updated from MCP",
    });
    expect((updatedComment.structuredContent as { comment: { body: string } }).comment.body).toBe("Updated from MCP");

    const deleted = mcp.callMcpTool("delete_comment", { itemId, commentId });
    expect((deleted.structuredContent as { comment: { deletedAt: string | null } }).comment.deletedAt).not.toBeNull();

    expect((mcp.callMcpTool("resolve_item", { id: itemId }).structuredContent as { item: { status: string } }).item.status).toBe(
      "resolved",
    );
    expect((mcp.callMcpTool("archive_item", { id: itemId }).structuredContent as { item: { archivedAt: string | null } }).item.archivedAt).not.toBeNull();
    expect((mcp.callMcpTool("unarchive_item", { id: itemId }).structuredContent as { item: { archivedAt: string | null } }).item.archivedAt).toBeNull();

    expect(() => mcp.callMcpTool("unknown_tool", {})).toThrow("Unknown MCP tool");
  });
});
