// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { Comment, Item } from "@/lib/schemas";
import { createIsolatedRuntime } from "./helpers/isolated-runtime";

const timestamp = "2026-04-03T12:00:00.000Z";

const baseItem = {
  id: "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
  title: "Initial item",
  details: "Seeded detail",
  status: "active" as const,
  archivedAt: null,
  resolvedAt: null,
  snoozedUntil: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};

describe("component exports", () => {
  let cleanup: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    await cleanup?.();
    cleanup = (await createIsolatedRuntime()).cleanup;
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  test("ParkingLotApp renders initial state and supports create-item flow", async () => {
    const user = userEvent.setup();
    const { ParkingLotApp } = await import("@/components/parking-lot-app");

    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      if (input === "/api/items" && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            item: {
              ...baseItem,
              id: "b05e453d-23f1-422b-b798-65c9d07867f5",
              title: "Created item",
              details: "Created from UI",
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      }

      if (input === "/api/items?view=active") {
        return new Response(
          JSON.stringify({
            items: [
              {
                ...baseItem,
                id: "b05e453d-23f1-422b-b798-65c9d07867f5",
                title: "Created item",
                details: "Created from UI",
              },
            ],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (input === "/api/items/b05e453d-23f1-422b-b798-65c9d07867f5") {
        return new Response(
          JSON.stringify({
            item: {
              ...baseItem,
              id: "b05e453d-23f1-422b-b798-65c9d07867f5",
              title: "Created item",
              details: "Created from UI",
            },
            comments: [],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      throw new Error(`Unexpected fetch call: ${input}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    class MockEventSource {
      public onerror: (() => void) | null = null;
      private listeners = new Map<string, Set<(event: MessageEvent<string>) => void>>();

      addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
        const group = this.listeners.get(type) ?? new Set();
        group.add(listener);
        this.listeners.set(type, group);
      }

      close() {}
    }

    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);

    render(<ParkingLotApp initialItems={[baseItem]} initialSelectedDetail={null} />);

    expect(screen.getByText("Initial item")).toBeInTheDocument();
    expect(screen.getByText("Active view loaded.")).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByLabelText("Title")).toBeNull();
    expect(screen.getByText("Capture the next task, follow-up, or idea you want to keep in view.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByRole("button", { name: "Close form" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("The form is open below. Add a short title and save it to the list.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close form" }));
    expect(screen.queryByLabelText("Title")).toBeNull();
    expect(screen.getByText("Capture the next task, follow-up, or idea you want to keep in view.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.type(screen.getByLabelText("Title"), "Created item");
    await user.type(screen.getByLabelText("Details"), "Created from UI");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/items",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(await screen.findByText("Created item")).toBeInTheDocument();
    expect(screen.getByText("Item detail")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Created from UI")).toBeInTheDocument();
  });

  test("ParkingLotApp supports selected detail interactions and error dismissal", async () => {
    const user = userEvent.setup();
    const { ParkingLotApp } = await import("@/components/parking-lot-app");
    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-03T13:20:00.000Z").valueOf());
    const laterTodayDefault = new Date("2026-04-03T13:20:00.000Z");
    laterTodayDefault.setHours(laterTodayDefault.getHours() + 4, 0, 0, 0);

    if (new Date("2026-04-03T13:20:00.000Z").getMinutes() !== 0) {
      laterTodayDefault.setHours(laterTodayDefault.getHours() + 1);
    }

    const initialItem: Item = {
      ...baseItem,
      id: "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
      title: "Created item",
      details: "Initial details",
    };

    const initialDetail: { item: Item; comments: Comment[] } = {
      item: initialItem,
      comments: [
        {
          id: "b05e453d-23f1-422b-b798-65c9d07867f5",
          itemId: initialItem.id,
          body: "Existing note",
          authorType: "human" as const,
          authorLabel: "Franke",
          deletedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    };

    let currentItem: Item = { ...initialItem };
    let currentComments: Comment[] = [...initialDetail.comments];

    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      const target = String(input);

      if (target === `/api/items/${initialItem.id}` && init?.method === "PATCH") {
        currentItem = {
          ...currentItem,
          title: "Renamed item",
          details: "Updated details with docs\nhttps://example.com/guide, plus plain text around it.",
          updatedAt: "2026-04-03T13:00:00.000Z",
        };

        return new Response(JSON.stringify({ item: currentItem }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (target === `/api/items/${initialItem.id}`) {
        return new Response(
          JSON.stringify({
            item: currentItem,
            comments: currentComments,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (target === "/api/items?view=resolved") {
        return new Response(
          JSON.stringify({ items: currentItem.archivedAt ? [] : currentItem.status === "resolved" ? [currentItem] : [] }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (target === "/api/items?view=snoozed") {
        return new Response(
          JSON.stringify({ items: !currentItem.archivedAt && currentItem.snoozedUntil ? [currentItem] : [] }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (target === "/api/items?view=archived") {
        return new Response(
          JSON.stringify({
            items: currentItem.archivedAt ? [currentItem] : [],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (target === "/api/items?view=active") {
        return new Response(
          JSON.stringify({ items: !currentItem.archivedAt && currentItem.status === "active" && !currentItem.snoozedUntil ? [currentItem] : [] }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (target === `/api/items/${initialItem.id}/comments` && init?.method === "POST") {
        const createdComment = {
          id: "4e0df6b7-2c45-4cae-a310-0d930fe5c314",
          itemId: initialItem.id,
          body: "New note",
          authorType: "human" as const,
          authorLabel: null,
          deletedAt: null,
          createdAt: "2026-04-03T13:15:00.000Z",
          updatedAt: "2026-04-03T13:15:00.000Z",
        };
        currentComments = [...currentComments, createdComment];
        currentItem = { ...currentItem, updatedAt: createdComment.updatedAt };

        return new Response(JSON.stringify({ comment: createdComment }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (target === `/api/items/${initialItem.id}/comments/${initialDetail.comments[0].id}` && init?.method === "PATCH") {
        currentComments = currentComments.map((comment) =>
          comment.id === initialDetail.comments[0].id
            ? {
                ...comment,
                body: "Edited note",
                updatedAt: "2026-04-03T13:30:00.000Z",
              }
            : comment,
        );

        return new Response(
          JSON.stringify({
            comment: currentComments[0],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (target === `/api/items/${initialItem.id}/comments/${initialDetail.comments[0].id}` && init?.method === "DELETE") {
        currentComments = currentComments.filter((comment) => comment.id !== initialDetail.comments[0].id);

        return new Response(
          JSON.stringify({
            comment: {
              ...initialDetail.comments[0],
              deletedAt: "2026-04-03T13:45:00.000Z",
            },
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (target === `/api/items/${initialItem.id}/archive`) {
        currentItem = {
          ...currentItem,
          archivedAt: "2026-04-03T14:00:00.000Z",
          snoozedUntil: null,
          updatedAt: "2026-04-03T14:00:00.000Z",
        };

        return new Response(
          JSON.stringify({
            item: currentItem,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (target === `/api/items/${initialItem.id}/unarchive`) {
        currentItem = {
          ...currentItem,
          status: "active",
          archivedAt: null,
          snoozedUntil: null,
          updatedAt: "2026-04-03T14:05:00.000Z",
        };

        return new Response(
          JSON.stringify({
            item: currentItem,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (target === `/api/items/${initialItem.id}/resolve`) {
        return new Response(JSON.stringify({ error: "Resolve failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (target === `/api/items/${initialItem.id}/snooze`) {
        currentItem = {
          ...currentItem,
          snoozedUntil: "2099-04-03T16:00:00.000Z",
          updatedAt: "2026-04-03T14:10:00.000Z",
        };

        return new Response(JSON.stringify({ item: currentItem }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch call: ${target}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal(
      "EventSource",
      class {
        addEventListener() {}
        close() {}
      } as unknown as typeof EventSource,
    );

    render(<ParkingLotApp initialItems={[initialItem]} initialSelectedDetail={initialDetail} />);

    expect(screen.getByText("Existing note")).toBeInTheDocument();
    const detailPanel = screen.getByText("Keep the item focused without losing the thread around it.").closest("section");
    expect(detailPanel).toBeTruthy();
    const descriptionPreview = screen.getByText("Description preview").closest("div");
    expect(descriptionPreview).toBeTruthy();
    expect(within(descriptionPreview as HTMLElement).getByText("Initial details")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Write a comment" }));
    await user.type(screen.getByLabelText("New comment"), "New note");
    await user.click(screen.getByRole("button", { name: "Post comment" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/items/${initialItem.id}/comments`,
        expect.objectContaining({ method: "POST" }),
      );
    });

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Renamed item");
    await user.clear(screen.getByLabelText("Details"));
    await user.type(
      screen.getByLabelText("Details"),
      "Updated details with docs\nhttps://example.com/guide, plus plain text around it.",
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/items/${initialItem.id}`,
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    const detailLink = await screen.findByRole("link", { name: "https://example.com/guide" });
    expect(detailLink).toHaveAttribute("href", "https://example.com/guide");
    expect(detailLink).toHaveAttribute("target", "_blank");
    expect(detailLink).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
    expect(detailLink).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(within(descriptionPreview as HTMLElement).getByText(/Updated details with docs/)).toBeInTheDocument();
    expect(within(descriptionPreview as HTMLElement).getByText(/plus plain text around it\./)).toBeInTheDocument();
    expect((descriptionPreview as HTMLElement).textContent).toContain("Updated details with docs\nhttps://example.com/guide, plus plain text around it.");

    const existingNoteCard = screen.getByText("Existing note").closest("li");
    expect(existingNoteCard).toBeTruthy();

    await user.click(within(existingNoteCard as HTMLElement).getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Edit comment"));
    await user.type(screen.getByLabelText("Edit comment"), "Edited note");
    await user.click(screen.getByRole("button", { name: "Save comment" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/items/${initialItem.id}/comments/${initialDetail.comments[0].id}`,
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    const editedNoteCard = await screen.findByText("Edited note").then((node) => node.closest("li"));
    expect(editedNoteCard).toBeTruthy();

    await user.click(within(editedNoteCard as HTMLElement).getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(within(editedNoteCard as HTMLElement).getByRole("button", { name: "Delete comment" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/items/${initialItem.id}/comments/${initialDetail.comments[0].id}`,
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    await user.click(within(detailPanel as HTMLElement).getByRole("button", { name: "Mark resolved" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Resolve failed");

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });

    expect(screen.getByLabelText("Date")).toHaveValue(
      `${laterTodayDefault.getFullYear()}-${String(laterTodayDefault.getMonth() + 1).padStart(2, "0")}-${String(laterTodayDefault.getDate()).padStart(2, "0")}`,
    );
    expect(screen.getByLabelText("Time")).toHaveValue(
      `${String(laterTodayDefault.getHours()).padStart(2, "0")}:${String(laterTodayDefault.getMinutes()).padStart(2, "0")}`,
    );

    await user.click(screen.getByLabelText("Tomorrow"));
    expect(screen.getByLabelText("Date")).toHaveValue("2026-04-04");
    expect(screen.getByLabelText("Time")).toHaveValue("08:00");

    await user.click(screen.getByLabelText("Next week"));
    expect(screen.getByLabelText("Date")).toHaveValue("2026-04-10");
    expect(screen.getByLabelText("Time")).toHaveValue("08:00");

    await user.click(screen.getByLabelText("Custom"));
    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), "2026-04-12");
    await user.clear(screen.getByLabelText("Time"));
    await user.type(screen.getByLabelText("Time"), "09:30");
    await user.click(screen.getByRole("button", { name: "Snooze for later" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/items/${initialItem.id}/snooze`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ snoozedUntil: new Date("2026-04-12T09:30").toISOString() }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Snoozed" })).toHaveAttribute("aria-selected", "true");
    });

    await user.click(screen.getByRole("tab", { name: "Active" }));
    await waitFor(() => {
      expect(screen.getByText("Nothing is parked right now. Add the next thing you are juggling.")).toBeInTheDocument();
    });

    currentItem = {
      ...currentItem,
      snoozedUntil: null,
      updatedAt: "2026-04-03T14:12:00.000Z",
    };

    await user.click(screen.getByRole("tab", { name: "Snoozed" }));
    await waitFor(() => {
      expect(screen.getByText("Snoozed items will wait here until their wake-up time arrives.")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: "Active" }));
    expect(await screen.findByRole("button", { name: /Renamed item/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Renamed item/i }));
    expect(await screen.findByText("Item detail")).toBeInTheDocument();
    expect(screen.getByText("Not snoozed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archive item" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/items/${initialItem.id}/archive`,
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Archived" })).toHaveAttribute("aria-selected", "true");
    });

    expect(screen.queryByText("Item detail")).toBeNull();
    dateNowSpy.mockRestore();
  });

  test("ParkingLotApp renders archived detail state and supports unarchive", async () => {
    const user = userEvent.setup();
    const { ParkingLotApp } = await import("@/components/parking-lot-app");

    const archivedItem: Item = {
      ...baseItem,
      id: "36b481a2-d13b-4c4c-ad8b-71f696eb79d3",
      title: "Archived item",
      status: "resolved",
      archivedAt: "2026-04-03T14:00:00.000Z",
      resolvedAt: "2026-04-03T13:00:00.000Z",
      updatedAt: "2026-04-03T14:00:00.000Z",
    };

    let currentItem: Item = { ...archivedItem };

    const fetchMock = vi.fn(async (input: string) => {
      const target = String(input);

      if (target === `/api/items/${archivedItem.id}/unarchive`) {
        currentItem = {
          ...currentItem,
          status: "resolved",
          archivedAt: null,
          updatedAt: "2026-04-03T14:05:00.000Z",
        };

        return new Response(JSON.stringify({ item: currentItem }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (target === "/api/items?view=resolved") {
        return new Response(JSON.stringify({ items: [currentItem] }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch call: ${target}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal(
      "EventSource",
      class {
        addEventListener() {}
        close() {}
      } as unknown as typeof EventSource,
    );

    render(<ParkingLotApp initialItems={[archivedItem]} initialSelectedDetail={{ item: archivedItem, comments: [] }} />);

    const detailPanel = screen.getByText("Item detail").closest("section");
    expect(detailPanel).toBeTruthy();

    const archivedBadge = within(detailPanel as HTMLElement).getByText("Archived");
    const unarchiveButton = screen.getByRole("button", { name: "Restore item" });

    expect(archivedBadge).toBeInTheDocument();
    expect(screen.getByText("Not snoozed")).toBeInTheDocument();
    expect(unarchiveButton).toBeInTheDocument();

    await user.click(unarchiveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/items/${archivedItem.id}/unarchive`,
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Resolved" })).toHaveAttribute("aria-selected", "true");
    });
  });

  test("app entry exports render the expected wrappers", async () => {
    const parkingLotModule = await import("@/lib/parking-lot");
    const listSpy = vi.spyOn(parkingLotModule, "listParkingLotItems").mockReturnValue({ items: [baseItem] });

    const pageModule = await import("@/app/page");
    const layoutModule = await import("@/app/layout");

    expect(pageModule.dynamic).toBe("force-dynamic");
    expect(layoutModule.metadata.title).toBe("Parking Lot");
    expect(layoutModule.metadata.description).toContain("local-first");

    const pageMarkup = await import("react-dom/server").then(({ renderToStaticMarkup }) => renderToStaticMarkup(pageModule.default()));
    expect(listSpy).toHaveBeenCalledWith("active");
    expect(pageMarkup).toContain("Initial item");

    const layoutMarkup = await import("react-dom/server").then(({ renderToStaticMarkup }) =>
      renderToStaticMarkup(layoutModule.default({ children: React.createElement("div", null, "Child content") })),
    );
    expect(layoutMarkup).toContain("<html lang=\"en\"");
    expect(layoutMarkup).toContain("Child content");
  });

  test("ParkingLotApp handles loading, close-detail, and empty-detail states", async () => {
    const { ParkingLotApp } = await import("@/components/parking-lot-app");

    let resolveDetail!: (response: Response) => void;
    const delayedDetail = new Promise<Response>((resolve) => {
      resolveDetail = resolve;
    });
    const fetchMock = vi.fn((input: string) => {
      const target = String(input);

      if (target === `/api/items/${baseItem.id}`) {
        return delayedDetail;
      }

      if (target === "/api/items?view=resolved") {
        return Promise.resolve(
          new Response(JSON.stringify({ items: [] }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (target === "/api/items?view=active") {
        return Promise.resolve(
          new Response(JSON.stringify({ items: [baseItem] }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      throw new Error(`Unexpected fetch call: ${target}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    class MockEventSource {
      static instances: MockEventSource[] = [];

      public onerror: (() => void) | null = null;
      private listeners = new Map<string, Set<(event: MessageEvent<string>) => void>>();

      constructor() {
        MockEventSource.instances.push(this);
      }

      addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
        const group = this.listeners.get(type) ?? new Set();
        group.add(listener);
        this.listeners.set(type, group);
      }

      close() {}

      emit(type: string, payload: unknown) {
        this.listeners.get(type)?.forEach((listener) => {
          listener({ data: JSON.stringify(payload) } as MessageEvent<string>);
        });
      }
    }

    const user = userEvent.setup();
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);

    render(<ParkingLotApp initialItems={[baseItem]} initialSelectedDetail={null} />);

    await user.click(screen.getByRole("button", { name: /Initial item/i }));
    expect(await screen.findByText("Loading item detail")).toBeInTheDocument();
    expect(screen.getByText("Pulling the latest comments and metadata from local storage.")).toBeInTheDocument();

    resolveDetail(
      new Response(JSON.stringify({ item: baseItem, comments: [] }), {
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(await screen.findByText("No comments yet. Add the first breadcrumb that explains what changed or why it matters.")).toBeInTheDocument();
    expect(screen.getByText("Not resolved")).toBeInTheDocument();
    expect(screen.getByText("Not snoozed")).toBeInTheDocument();
    expect(screen.getByText("Not archived")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.type(screen.getByLabelText("New comment"), "Will be cleared");
    await user.selectOptions(screen.getByLabelText("Author type"), "agent");
    await user.type(screen.getByLabelText("Optional label"), "Planner");
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByLabelText("New comment")).toHaveValue("");
    expect(screen.getByLabelText("Author type")).toHaveValue("human");
    expect(screen.getByLabelText("Optional label")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Back to overview" }));
    expect(screen.queryByText("Item detail")).toBeNull();
    expect(screen.getByText("Returned to overview.")).toHaveAttribute("aria-live", "polite");

    await user.click(screen.getByRole("tab", { name: "Resolved" }));
    expect(await screen.findByText("Resolved work will collect here once something is finished.")).toBeInTheDocument();

    expect(MockEventSource.instances.length).toBeGreaterThan(0);
  });

  test("ParkingLotApp closes detail with Escape and ignores Escape when no detail is open", async () => {
    const { ParkingLotApp } = await import("@/components/parking-lot-app");

    const fetchMock = vi.fn((input: string) => {
      const target = String(input);

      if (target === `/api/items/${baseItem.id}`) {
        return Promise.resolve(
          new Response(JSON.stringify({ item: baseItem, comments: [] }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      throw new Error(`Unexpected fetch call: ${target}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal(
      "EventSource",
      class {
        addEventListener() {}
        close() {}
      } as unknown as typeof EventSource,
    );

    const user = userEvent.setup();
    render(<ParkingLotApp initialItems={[baseItem]} initialSelectedDetail={null} />);

    await user.keyboard("{Escape}");

    expect(screen.getByText("Initial item")).toBeInTheDocument();
    expect(screen.queryByText("Item detail")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Initial item/i }));
    expect(await screen.findByText("Item detail")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("Item detail")).toBeNull();
    });
    expect(screen.getByText("Returned to overview.")).toHaveAttribute("aria-live", "polite");
  });

  test("ParkingLotApp reorders active items with drag and drop and persists the returned order", async () => {
    const { ParkingLotApp } = await import("@/components/parking-lot-app");

    const secondItem = {
      ...baseItem,
      id: "b05e453d-23f1-422b-b798-65c9d07867f5",
      title: "Second item",
      details: "Created second",
      updatedAt: "2026-04-03T12:05:00.000Z",
    };

    const fetchMock = vi.fn((input: string, init?: RequestInit) => {
      const target = String(input);

      if (target === "/api/items/reorder" && init?.method === "POST") {
        return Promise.resolve(
          new Response(JSON.stringify({ items: [secondItem, baseItem] }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      throw new Error(`Unexpected fetch call: ${target}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal(
      "EventSource",
      class {
        addEventListener() {}
        close() {}
      } as unknown as typeof EventSource,
    );

    render(<ParkingLotApp initialItems={[baseItem, secondItem]} initialSelectedDetail={null} />);

    const firstCard = screen.getByRole("button", { name: /Initial item/i });
    const secondCard = screen.getByRole("button", { name: /Second item/i });

    const dataTransfer = {
      effectAllowed: "move",
      setData: vi.fn(),
      getData: vi.fn(),
    } as unknown as DataTransfer;

    fireEvent.dragStart(firstCard, { dataTransfer });
    fireEvent.dragOver(secondCard, { dataTransfer });
    fireEvent.drop(secondCard, { dataTransfer });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/items/reorder",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const itemButtons = screen.getAllByRole("button").filter((node) =>
      node.textContent?.includes("Initial item") || node.textContent?.includes("Second item"),
    );
    expect(itemButtons[0]).toHaveTextContent("Second item");
    expect(screen.getByText("Active order updated.")).toHaveAttribute("aria-live", "polite");
  });

  test("ParkingLotApp reconnects event stream and ignores mismatched item-created views", async () => {
    const { ParkingLotApp } = await import("@/components/parking-lot-app");

    const fetchMock = vi.fn((input: string) => {
      const target = String(input);

      if (target === "/api/items?view=resolved") {
        return Promise.resolve(
          new Response(JSON.stringify({ items: [] }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      throw new Error(`Unexpected fetch call: ${target}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    class MockEventSource {
      static instances: MockEventSource[] = [];

      public onerror: (() => void) | null = null;
      private listeners = new Map<string, Set<(event: MessageEvent<string>) => void>>();

      constructor() {
        MockEventSource.instances.push(this);
      }

      addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
        const group = this.listeners.get(type) ?? new Set();
        group.add(listener);
        this.listeners.set(type, group);
      }

      close() {}

      emit(type: string, payload: unknown) {
        this.listeners.get(type)?.forEach((listener) => {
          listener({ data: JSON.stringify(payload) } as MessageEvent<string>);
        });
      }
    }

    const user = userEvent.setup();
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);

    render(<ParkingLotApp initialItems={[baseItem]} initialSelectedDetail={null} />);

    await user.click(screen.getByRole("tab", { name: "Resolved" }));
    expect(await screen.findByText("Resolved work will collect here once something is finished.")).toBeInTheDocument();

    const firstSource = MockEventSource.instances.at(-1);
    expect(firstSource).toBeTruthy();

    firstSource!.emit("item-created", { itemId: baseItem.id, view: "active" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    firstSource!.onerror?.();
    await new Promise((resolve) => setTimeout(resolve, 1600));

    const secondSource = MockEventSource.instances.at(-1);
    expect(secondSource).toBeTruthy();
    expect(secondSource).not.toBe(firstSource);
    secondSource!.emit("item-created", { itemId: baseItem.id, view: "resolved" });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  }, 10000);

  test("ParkingLotApp shows snoozed items and returns them to active after refresh", async () => {
    const { ParkingLotApp } = await import("@/components/parking-lot-app");

    const snoozedItem: Item = {
      ...baseItem,
      title: "Waiting item",
      snoozedUntil: "2099-04-03T16:00:00.000Z",
    };

    let activeItems: Item[] = [];
    let snoozedItems: Item[] = [snoozedItem];

    const fetchMock = vi.fn((input: string) => {
      const target = String(input);

      if (target === "/api/items?view=snoozed") {
        return Promise.resolve(
          new Response(JSON.stringify({ items: snoozedItems }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (target === "/api/items?view=active") {
        return Promise.resolve(
          new Response(JSON.stringify({ items: activeItems }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      throw new Error(`Unexpected fetch call: ${target}`);
    });

    class MockEventSource {
      addEventListener() {}
      close() {}
    }

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);

    const user = userEvent.setup();
    render(<ParkingLotApp initialItems={[snoozedItem]} initialSelectedDetail={null} />);

    await user.click(screen.getByRole("tab", { name: "Snoozed" }));
    expect(await screen.findByText("Waiting item")).toBeInTheDocument();

    snoozedItems = [];
    activeItems = [{ ...snoozedItem, snoozedUntil: null, updatedAt: "2026-04-03T17:00:00.000Z" }];

    await user.click(screen.getByRole("tab", { name: "Active" }));
    expect(await screen.findByText("Waiting item")).toBeInTheDocument();
    expect(screen.getByText("Active view opened.")).toHaveAttribute("aria-live", "polite");
  });
});
