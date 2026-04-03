import path from "node:path";
import os from "node:os";
import { mkdtemp, rm } from "node:fs/promises";

import { vi } from "vitest";

type GlobalWithDatabase = typeof globalThis & {
  parkingLotDb?: { close: () => void };
};

export type IsolatedRuntime = {
  databasePath: string;
  cleanup: () => Promise<void>;
};

async function closeGlobalDatabase() {
  const globalForDatabase = globalThis as GlobalWithDatabase;

  if (!globalForDatabase.parkingLotDb) {
    return;
  }

  globalForDatabase.parkingLotDb.close();
  delete globalForDatabase.parkingLotDb;
}

export async function createIsolatedRuntime(): Promise<IsolatedRuntime> {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "parkinglot-vitest-"));
  const previousDatabasePath = process.env.PARKINGLOT_DB_PATH;
  const databasePath = path.join(tempDirectory, "parkinglot.db");

  await closeGlobalDatabase();
  process.env.PARKINGLOT_DB_PATH = databasePath;
  vi.resetModules();

  return {
    databasePath,
    cleanup: async () => {
      await closeGlobalDatabase();
      vi.resetModules();

      if (previousDatabasePath === undefined) {
        delete process.env.PARKINGLOT_DB_PATH;
      } else {
        process.env.PARKINGLOT_DB_PATH = previousDatabasePath;
      }

      await rm(tempDirectory, { recursive: true, force: true });
    },
  };
}

export async function withIsolatedRuntime<T>(run: () => Promise<T>) {
  const runtime = await createIsolatedRuntime();

  try {
    return await run();
  } finally {
    await runtime.cleanup();
  }
}

export function createRouteContext<T extends Record<string, string>>(params: T) {
  return {
    params: Promise.resolve(params),
  };
}

export async function readJson(response: Response) {
  return response.json();
}

export async function readStreamChunk(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const chunk = await reader.read();

  if (chunk.done || !chunk.value) {
    return { done: chunk.done, text: "" };
  }

  return {
    done: false,
    text: new TextDecoder().decode(chunk.value),
  };
}
