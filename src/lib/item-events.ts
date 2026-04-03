import { type ItemView } from "./schemas.ts";

export type ItemCreatedEvent = {
  type: "item-created";
  itemId: string;
  view: ItemView;
};

type ItemEventListener = (event: ItemCreatedEvent) => void;

const listeners = new Set<ItemEventListener>();

export function publishItemCreatedEvent(event: Omit<ItemCreatedEvent, "type">) {
  const payload: ItemCreatedEvent = { type: "item-created", ...event };

  for (const listener of listeners) {
    listener(payload);
  }
}

export function subscribeToItemEvents(listener: ItemEventListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
