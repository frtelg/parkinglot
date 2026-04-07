// @vitest-environment jsdom

import { render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useItemEvents } from "@/components/parking-lot/use-item-events";

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

function Harness({ view, onMatchingItemCreated }: { view: "active" | "resolved" | "snoozed" | "archived"; onMatchingItemCreated: () => void }) {
  useItemEvents({ view, onMatchingItemCreated });
  return React.createElement("div");
}

describe("useItemEvents", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockEventSource.instances = [];
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("calls back only for matching views and reconnects on error", async () => {
    const onMatchingItemCreated = vi.fn();

    render(<Harness view="resolved" onMatchingItemCreated={onMatchingItemCreated} />);

    const firstSource = MockEventSource.instances.at(-1);
    expect(firstSource).toBeTruthy();

    firstSource!.emit("item-created", { itemId: "1", view: "active" });
    firstSource!.emit("item-created", { itemId: "1", view: "resolved" });
    expect(onMatchingItemCreated).toHaveBeenCalledTimes(1);

    firstSource!.onerror?.();
    await vi.advanceTimersByTimeAsync(1600);

    const secondSource = MockEventSource.instances.at(-1);
    expect(secondSource).toBeTruthy();
    expect(secondSource).not.toBe(firstSource);

    secondSource!.emit("item-created", { itemId: "1", view: "resolved" });
    expect(onMatchingItemCreated).toHaveBeenCalledTimes(2);
  });
});
