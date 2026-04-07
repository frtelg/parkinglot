import { useEffect } from "react";

import type { ItemView } from "@/lib/schemas";

import type { ItemCreatedEvent } from "./types";

type UseItemEventsOptions = {
  view: ItemView;
  onMatchingItemCreated: () => void;
};

export function useItemEvents({ view, onMatchingItemCreated }: UseItemEventsOptions) {
  useEffect(() => {
    let isDisposed = false;
    let reconnectTimer: number | null = null;
    let source: EventSource | null = null;

    function cleanupSource() {
      if (!source) {
        return;
      }

      source.close();
      source = null;
    }

    function scheduleReconnect() {
      if (isDisposed || reconnectTimer !== null) {
        return;
      }

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 1500);
    }

    function connect() {
      cleanupSource();
      const nextSource = new EventSource("/api/items/events");
      source = nextSource;

      nextSource.addEventListener("item-created", (event) => {
        const payload = JSON.parse((event as MessageEvent<string>).data) as ItemCreatedEvent;

        if (payload.view !== view) {
          return;
        }

        onMatchingItemCreated();
      });

      nextSource.onerror = () => {
        cleanupSource();
        scheduleReconnect();
      };
    }

    connect();

    return () => {
      isDisposed = true;

      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }

      cleanupSource();
    };
  }, [onMatchingItemCreated, view]);
}
