#!/usr/bin/env node

import process from "node:process";

const { callMcpTool, listMcpTools } = await import("../src/lib/mcp-server.ts");

async function readStdin() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8").trim();
}

const input = await readStdin();

if (!input) {
  process.stdout.write(
    JSON.stringify(
      {
        server: "parking-lot-mcp",
        tools: listMcpTools(),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const request = JSON.parse(input);

if (request.method === "tools/list") {
  process.stdout.write(JSON.stringify({ tools: listMcpTools() }, null, 2));
  process.exit(0);
}

if (request.method === "tools/call") {
  process.stdout.write(
    JSON.stringify(callMcpTool(String(request.params?.name), request.params?.arguments ?? {}), null, 2),
  );
  process.exit(0);
}

process.stderr.write(`Unsupported MCP method: ${request.method}\n`);
process.exit(1);
