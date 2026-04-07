#!/usr/bin/env node

import process from "node:process";

const { callMcpTool, listMcpTools } = await import("../src/lib/mcp-server.ts");

const JSON_RPC_VERSION = "2.0";
const SERVER_INFO = {
  name: "parking-lot-mcp",
  version: "0.1.0",
};

let inputBuffer = Buffer.alloc(0);
let initialized = false;

function writeMessage(message) {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

function sendResponse(id, result) {
  if (id === undefined) {
    return;
  }

  writeMessage({
    jsonrpc: JSON_RPC_VERSION,
    id,
    result,
  });
}

function sendError(id, code, message, data) {
  if (id === undefined) {
    return;
  }

  writeMessage({
    jsonrpc: JSON_RPC_VERSION,
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  });
}

function parseMessage(buffer) {
  const separatorIndex = buffer.indexOf("\r\n\r\n");

  if (separatorIndex === -1) {
    return null;
  }

  const headerText = buffer.subarray(0, separatorIndex).toString("utf8");
  const headers = new Map();

  for (const line of headerText.split("\r\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      throw new Error(`Malformed MCP header: ${line}`);
    }

    const name = line.slice(0, colonIndex).trim().toLowerCase();
    const value = line.slice(colonIndex + 1).trim();
    headers.set(name, value);
  }

  const contentLength = Number.parseInt(headers.get("content-length") ?? "", 10);

  if (!Number.isFinite(contentLength) || contentLength < 0) {
    throw new Error("Missing or invalid Content-Length header");
  }

  const messageStart = separatorIndex + 4;
  const messageEnd = messageStart + contentLength;

  if (buffer.length < messageEnd) {
    return null;
  }

  return {
    message: JSON.parse(buffer.subarray(messageStart, messageEnd).toString("utf8")),
    remaining: buffer.subarray(messageEnd),
  };
}

function ensureInitialized(method) {
  if (initialized || method === "initialize" || method === "notifications/initialized") {
    return true;
  }

  return false;
}

async function handleMessage(message) {
  const id = message?.id;
  const method = message?.method;

  if (typeof method !== "string") {
    sendError(id, -32600, "Invalid Request", { reason: "Missing method" });
    return;
  }

  if (!ensureInitialized(method)) {
    sendError(id, -32002, "Server not initialized");
    return;
  }

  try {
    switch (method) {
      case "initialize": {
        initialized = true;
        sendResponse(id, {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: SERVER_INFO,
        });
        return;
      }
      case "notifications/initialized": {
        return;
      }
      case "ping": {
        sendResponse(id, {});
        return;
      }
      case "tools/list": {
        sendResponse(id, { tools: listMcpTools() });
        return;
      }
      case "tools/call": {
        const toolName = String(message.params?.name ?? "");
        const toolArgs = isPlainObject(message.params?.arguments) ? message.params.arguments : {};
        sendResponse(id, callMcpTool(toolName, toolArgs));
        return;
      }
      default: {
        sendError(id, -32601, `Method not found: ${method}`);
      }
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    sendError(id, -32000, messageText);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

process.stdin.on("data", async (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);

  while (true) {
    let parsed;

    try {
      parsed = parseMessage(inputBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
      process.exit();
      return;
    }

    if (!parsed) {
      break;
    }

    inputBuffer = parsed.remaining;
    await handleMessage(parsed.message);
  }
});

process.stdin.on("end", () => {
  process.exit(0);
});
