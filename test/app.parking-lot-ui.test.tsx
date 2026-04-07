// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, test, vi } from "vitest";

import { CreateItemSection } from "@/components/parking-lot/ui/create-item-section";
import { DetailOverlay } from "@/components/parking-lot/ui/detail-overlay";
import { ErrorBanner } from "@/components/parking-lot/ui/error-banner";
import { ItemDetailPanel } from "@/components/parking-lot/ui/item-detail-panel";
import { ItemList } from "@/components/parking-lot/ui/item-list";
import { ParkingLotHero } from "@/components/parking-lot/ui/parking-lot-hero";
import { ViewTabs } from "@/components/parking-lot/ui/view-tabs";
import type { Comment, Item } from "@/lib/schemas";

const timestamp = "2026-04-03T12:00:00.000Z";

const baseItem: Item = {
  id: "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
  title: "Initial item",
  details: "Initial details",
  status: "active",
  archivedAt: null,
  resolvedAt: null,
  snoozedUntil: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const baseComment: Comment = {
  id: "b05e453d-23f1-422b-b798-65c9d07867f5",
  itemId: baseItem.id,
  body: "Existing note",
  authorType: "human",
  authorLabel: "Franke",
  deletedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};

describe("parking lot ui components", () => {
  test("ParkingLotHero renders static copy", () => {
    render(<ParkingLotHero />);

    expect(screen.getByText("Keep the next item in view.")).toBeInTheDocument();
    expect(screen.getByText("Local machine only")).toBeInTheDocument();
  });

  test("ErrorBanner renders and dismisses", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<ErrorBanner error="Resolve failed" onDismiss={onDismiss} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Resolve failed");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("ViewTabs exposes current selection and selection callbacks", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<ViewTabs view="active" isViewLoading={false} onSelect={onSelect} />);

    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Resolved" }));
    expect(onSelect).toHaveBeenCalledWith("resolved");
  });

  test("CreateItemSection toggles copy and forwards form interactions", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
    const onCancel = vi.fn();
    const onTitleChange = vi.fn();
    const onDetailsChange = vi.fn();

    const { rerender } = render(
      <CreateItemSection
        formId="create-form"
        isOpen={false}
        title=""
        details=""
        pendingAction={null}
        onToggle={onToggle}
        onTitleChange={onTitleChange}
        onDetailsChange={onDetailsChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(
      <CreateItemSection
        formId="create-form"
        isOpen
        title="Created item"
        details="Created from UI"
        pendingAction={null}
        onToggle={onToggle}
        onTitleChange={onTitleChange}
        onDetailsChange={onDetailsChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("The inline form is open below.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Title"), "!");
    await user.type(screen.getByLabelText("Details"), "?");
    expect(onTitleChange).toHaveBeenCalled();
    expect(onDetailsChange).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save item" }));
    expect(onSubmit).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("ItemList renders cards, empty states, and drag/drop handlers", async () => {
    const user = userEvent.setup();
    const secondItem = { ...baseItem, id: "36b481a2-d13b-4c4c-ad8b-71f696eb79d3", title: "Second item" };
    const onItemClick = vi.fn();
    const onDragStart = vi.fn();
    const onDragOver = vi.fn();
    const onDrop = vi.fn();
    const onDragEnd = vi.fn();

    const { rerender } = render(
      <ItemList
        view="active"
        items={[baseItem, secondItem]}
        selectedId={baseItem.id}
        isViewLoading={false}
        canReorder
        draggedItemId={baseItem.id}
        dropTargetId={secondItem.id}
        onItemClick={onItemClick}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      />,
    );

    const firstCard = screen.getByRole("button", { name: /Initial item/i });
    const secondCard = screen.getByRole("button", { name: /Second item/i });
    await user.click(firstCard);
    expect(onItemClick).toHaveBeenCalledWith(baseItem);

    expect(firstCard).toHaveAttribute("draggable", "true");

    within(secondCard).getByText("Second item");

    const dataTransfer = { effectAllowed: "move", setData: vi.fn() } as unknown as DataTransfer;
    fireEvent.dragStart(firstCard, { dataTransfer });
    fireEvent.dragOver(secondCard, { dataTransfer });
    fireEvent.drop(secondCard, { dataTransfer });
    fireEvent.dragEnd(secondCard);

    expect(onDragStart).toHaveBeenCalled();
    expect(onDragOver).toHaveBeenCalled();
    expect(onDrop).toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalled();

    rerender(
      <ItemList
        view="resolved"
        items={[]}
        selectedId={null}
        isViewLoading={false}
        canReorder={false}
        draggedItemId={null}
        dropTargetId={null}
        onItemClick={onItemClick}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      />,
    );

    expect(screen.getByText("Resolved work will collect here once something is finished.")).toBeInTheDocument();

    rerender(
      <ItemList
        view="archived"
        items={[]}
        selectedId={null}
        isViewLoading
        canReorder={false}
        draggedItemId={null}
        dropTargetId={null}
        onItemClick={onItemClick}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      />,
    );
    expect(screen.getByText("Loading archived items...")).toBeInTheDocument();
  });

  test("DetailOverlay renders close controls and children", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <DetailOverlay onClose={onClose}>
        <div>Overlay content</div>
      </DetailOverlay>,
    );

    expect(screen.getByText("Overlay content")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close detail" }));
    await user.click(screen.getByRole("button", { name: "Back to overview" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test("ItemDetailPanel renders actions, snooze panel, and comment interactions", async () => {
    const user = userEvent.setup();
    const handlers = {
      onClose: vi.fn(),
      onSaveItem: vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault()),
      onDraftTitleChange: vi.fn(),
      onDraftDetailsChange: vi.fn(),
      onResolve: vi.fn(),
      onArchive: vi.fn(),
      onUnarchive: vi.fn(),
      onSelectSnoozeChoice: vi.fn(),
      onSnoozeDateChange: vi.fn(),
      onSnoozeTimeChange: vi.fn(),
      onSnooze: vi.fn(),
      onJumpToComposer: vi.fn(),
      onCreateComment: vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault()),
      onCommentBodyChange: vi.fn(),
      onCommentAuthorTypeChange: vi.fn(),
      onCommentAuthorLabelChange: vi.fn(),
      onClearCommentComposer: vi.fn(),
      onStartCommentEdit: vi.fn(),
      onEditingCommentBodyChange: vi.fn(),
      onSaveComment: vi.fn(),
      onCancelCommentEdit: vi.fn(),
      onDeleteComment: vi.fn(),
    };

    render(
      <ItemDetailPanel
        item={baseItem}
        comments={[baseComment]}
        detailRegionId="detail-region"
        detailHeadingRef={{ current: null }}
        draftTitle={baseItem.title}
        draftDetails="Updated details with docs\nhttps://example.com/guide, plus plain text around it."
        pendingAction={null}
        selectedSnoozeChoice="later-today"
        snoozeDate="2026-04-03"
        snoozeTime="18:00"
        commentBody="New note"
        commentAuthorType="human"
        commentAuthorLabel=""
        authorTypeLabels={{ human: "Human", agent: "Agent", system: "System" }}
        editingCommentId={null}
        editingCommentBody=""
        commentComposerRef={{ current: null }}
        {...handlers}
      />,
    );

    expect(screen.getByText("Item detail")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.com/guide" })).toBeInTheDocument();
    expect(screen.getByText("Existing note")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Resolve" }));
    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(screen.getByLabelText("Tomorrow"));
    await user.type(screen.getByLabelText("Date"), "2026-04-04");
    await user.type(screen.getByLabelText("Time"), "08:00");
    await user.click(screen.getByRole("button", { name: "Snooze item" }));
    await user.click(screen.getByRole("button", { name: "Jump to composer" }));
    await user.type(screen.getByLabelText("New comment"), "!");
    await user.selectOptions(screen.getByLabelText("Author type"), "agent");
    await user.type(screen.getByLabelText("Optional label"), "Planner");
    await user.click(screen.getByRole("button", { name: "Add comment" }));
    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(handlers.onResolve).toHaveBeenCalledTimes(1);
    expect(handlers.onArchive).toHaveBeenCalledTimes(1);
    expect(handlers.onSelectSnoozeChoice).toHaveBeenCalledWith("tomorrow");
    expect(handlers.onSnoozeDateChange).toHaveBeenCalled();
    expect(handlers.onSnoozeTimeChange).toHaveBeenCalled();
    expect(handlers.onSnooze).toHaveBeenCalledTimes(1);
    expect(handlers.onJumpToComposer).toHaveBeenCalledTimes(1);
    expect(handlers.onCommentBodyChange).toHaveBeenCalled();
    expect(handlers.onCommentAuthorTypeChange).toHaveBeenCalledWith("agent");
    expect(handlers.onCommentAuthorLabelChange).toHaveBeenCalled();
    expect(handlers.onCreateComment).toHaveBeenCalled();
    expect(handlers.onClearCommentComposer).toHaveBeenCalledTimes(1);
    expect(handlers.onStartCommentEdit).toHaveBeenCalledWith(baseComment);
    expect(handlers.onDeleteComment).toHaveBeenCalledWith(baseComment.id);
  });

  test("ItemDetailPanel shows unarchive action for archived items", async () => {
    const user = userEvent.setup();
    const onUnarchive = vi.fn();

    render(
      <ItemDetailPanel
        item={{ ...baseItem, archivedAt: timestamp, status: "resolved" }}
        comments={[]}
        detailRegionId="detail-region"
        detailHeadingRef={{ current: null }}
        draftTitle={baseItem.title}
        draftDetails={baseItem.details}
        pendingAction={null}
        selectedSnoozeChoice="later-today"
        snoozeDate="2026-04-03"
        snoozeTime="18:00"
        commentBody=""
        commentAuthorType="human"
        commentAuthorLabel=""
        authorTypeLabels={{ human: "Human", agent: "Agent", system: "System" }}
        editingCommentId={null}
        editingCommentBody=""
        commentComposerRef={{ current: null }}
        onClose={vi.fn()}
        onSaveItem={vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault())}
        onDraftTitleChange={vi.fn()}
        onDraftDetailsChange={vi.fn()}
        onResolve={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={onUnarchive}
        onSelectSnoozeChoice={vi.fn()}
        onSnoozeDateChange={vi.fn()}
        onSnoozeTimeChange={vi.fn()}
        onSnooze={vi.fn()}
        onJumpToComposer={vi.fn()}
        onCreateComment={vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault())}
        onCommentBodyChange={vi.fn()}
        onCommentAuthorTypeChange={vi.fn()}
        onCommentAuthorLabelChange={vi.fn()}
        onClearCommentComposer={vi.fn()}
        onStartCommentEdit={vi.fn()}
        onEditingCommentBodyChange={vi.fn()}
        onSaveComment={vi.fn()}
        onCancelCommentEdit={vi.fn()}
        onDeleteComment={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Unarchive" }));
    expect(onUnarchive).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Pause this item")).toBeNull();
  });
});
