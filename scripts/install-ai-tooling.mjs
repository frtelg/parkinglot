#!/usr/bin/env node

import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AI_DIR = path.join(ROOT, "ai");
const SKILL_SOURCE_DIR = path.join(AI_DIR, "skills");
const HOME = os.homedir();

const SUPPORTED_TOOLS = ["claude", "codex", "copilot", "opencode"];
const PARKINGLOT_SKILL = "parking-lot-tool";
const PARKINGLOT_SERVER_NAME = "parkinglot";

const SKILL_TARGETS = {
  claude: path.join(HOME, ".claude", "skills"),
  codex: path.join(HOME, ".agents", "skills"),
  opencode: path.join(HOME, ".config", "opencode", "skills"),
};

const MCP_TARGETS = {
  claude: {
    template: path.join(AI_DIR, "config", "claude.mcp.json"),
    destination: path.join(HOME, ".claude.json"),
    install: installJsonServerConfig,
    serverContainerKey: "mcpServers",
  },
  codex: {
    template: path.join(AI_DIR, "config", "codex.config.toml"),
    destination: path.join(HOME, ".codex", "config.toml"),
    install: installCodexConfig,
  },
  copilot: {
    template: path.join(AI_DIR, "config", "copilot.mcp.json"),
    destination: path.join(HOME, "Library", "Application Support", "Code", "User", "mcp.json"),
    install: installJsonServerConfig,
    serverContainerKey: "servers",
  },
  opencode: {
    template: path.join(AI_DIR, "config", "opencode.json"),
    destination: path.join(HOME, ".config", "opencode", "opencode.json"),
    install: installOpenCodeConfig,
  },
};

const PARKINGLOT_MCP_COMMAND = ["node", path.join(ROOT, "scripts", "parking-lot-mcp.mjs")];

function printHelp() {
  process.stdout.write(`Install global parking lot AI integrations.\n\nUsage:\n  node scripts/install-ai-tooling.mjs [--tool <name>] [--skills-only | --mcp-only]\n\nOptions:\n  --tool <name>    One of: ${SUPPORTED_TOOLS.join(", ")}\n  --skills-only    Install only the parking-lot-tool skill\n  --mcp-only       Install only the parkinglot MCP configuration\n  --help           Show this help text\n\nNotes:\n  - Existing tool config is preserved. Only the parkinglot entry is added or updated.\n  - Existing parking-lot-tool skill directories are replaced with the tracked repo copy.\n`);
}

function parseArgs(argv) {
  const tools = new Set();
  let installSkills = true;
  let installMcp = true;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--tool") {
      const tool = argv[index + 1];

      if (!tool || !SUPPORTED_TOOLS.includes(tool)) {
        throw new Error(`Expected one of ${SUPPORTED_TOOLS.join(", ")} after --tool`);
      }

      tools.add(tool);
      index += 1;
      continue;
    }

    if (arg === "--skills-only") {
      installMcp = false;
      continue;
    }

    if (arg === "--mcp-only") {
      installSkills = false;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    tools: tools.size > 0 ? Array.from(tools) : SUPPORTED_TOOLS,
    installSkills,
    installMcp,
  };
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readText(filePath) {
  return readFile(filePath, "utf8");
}

function stripJsonComments(text) {
  let result = "";
  let inString = false;
  let isEscaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    const next = text[index + 1];

    if (lineComment) {
      if (current === "\n") {
        lineComment = false;
        result += current;
      }
      continue;
    }

    if (blockComment) {
      if (current === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      result += current;

      if (isEscaped) {
        isEscaped = false;
      } else if (current === "\\") {
        isEscaped = true;
      } else if (current === '"') {
        inString = false;
      }

      continue;
    }

    if (current === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (current === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (current === '"') {
      inString = true;
    }

    result += current;
  }

  return result.replace(/,(\s*[}\]])/g, "$1");
}

function parseJsonc(text, filePath) {
  try {
    return JSON.parse(stripJsonComments(text));
  } catch (error) {
    throw new Error(`Could not parse ${path.relative(ROOT, filePath)} as JSON or JSONC: ${error.message}`);
  }
}

async function listSkillDirectories() {
  const entries = await readdir(SKILL_SOURCE_DIR, { withFileTypes: true });
  const skillDirs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillFile = path.join(SKILL_SOURCE_DIR, entry.name, "SKILL.md");

    if (await pathExists(skillFile)) {
      skillDirs.push(entry.name);
    }
  }

  return skillDirs.filter((name) => name === PARKINGLOT_SKILL).sort();
}

async function installSkillsForTool(tool) {
  const targetDir = SKILL_TARGETS[tool];

  if (!targetDir) {
    return {
      installed: [],
      note: "This tool uses global MCP configuration only.",
    };
  }

  const skillDirs = await listSkillDirectories();
  await mkdir(targetDir, { recursive: true });

  for (const skillDir of skillDirs) {
    const source = path.join(SKILL_SOURCE_DIR, skillDir);
    const destination = path.join(targetDir, skillDir);
    await rm(destination, { recursive: true, force: true });
    await cp(source, destination, { recursive: true });
  }

  return {
    installed: skillDirs,
    note: null,
  };
}

async function installJsonServerConfig(templatePath, destinationPath, serverContainerKey) {
  const template = normalizeJsonTemplate(parseJsonc(await readText(templatePath), templatePath), serverContainerKey);
  const existing = (await pathExists(destinationPath))
    ? parseJsonc(await readText(destinationPath), destinationPath)
    : {};

  const merged = {
    ...existing,
    [serverContainerKey]: {
      ...(existing[serverContainerKey] ?? {}),
      ...(template[serverContainerKey] ?? {}),
    },
  };

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}

async function installOpenCodeConfig(templatePath, destinationPath) {
  const template = normalizeOpenCodeTemplate(parseJsonc(await readText(templatePath), templatePath));
  const existing = (await pathExists(destinationPath))
    ? parseJsonc(await readText(destinationPath), destinationPath)
    : {};

  const merged = {
    ...existing,
    ...(template.$schema ? { $schema: existing.$schema ?? template.$schema } : {}),
    mcp: {
      ...(existing.mcp ?? {}),
      ...(template.mcp ?? {}),
    },
  };

  await writeFile(destinationPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}

async function installCodexConfig(templatePath, destinationPath) {
  const block = buildCodexBlock((await readText(templatePath)).trim());
  const existing = (await pathExists(destinationPath)) ? await readText(destinationPath) : "";
  const pattern = /\n?# parkinglot-mcp:start[\s\S]*?# parkinglot-mcp:end\n?/;

  const next = pattern.test(existing)
    ? existing.replace(pattern, `${block}\n`)
    : `${existing.trimEnd()}${existing.trim().length > 0 ? "\n\n" : ""}${block}\n`;

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, next, "utf8");
}

function normalizeJsonTemplate(template, serverContainerKey) {
  const serverConfig = template[serverContainerKey]?.[PARKINGLOT_SERVER_NAME];

  if (!serverConfig) {
    throw new Error(`Template is missing ${serverContainerKey}.${PARKINGLOT_SERVER_NAME}`);
  }

  return {
    [serverContainerKey]: {
      [PARKINGLOT_SERVER_NAME]: {
        ...serverConfig,
        args: [...PARKINGLOT_MCP_COMMAND.slice(1)],
      },
    },
  };
}

function normalizeOpenCodeTemplate(template) {
  const serverConfig = template.mcp?.[PARKINGLOT_SERVER_NAME];

  if (!serverConfig) {
    throw new Error(`Template is missing mcp.${PARKINGLOT_SERVER_NAME}`);
  }

  return {
    $schema: template.$schema,
    mcp: {
      [PARKINGLOT_SERVER_NAME]: {
        ...serverConfig,
        command: [...PARKINGLOT_MCP_COMMAND],
      },
    },
  };
}

function buildCodexBlock(block) {
  return block
    .replace('args = ["scripts/parking-lot-mcp.mjs"]', `args = ["${path.join(ROOT, "scripts", "parking-lot-mcp.mjs")}"]`)
    .replace('cwd = "."', `cwd = "${ROOT}"`);
}

async function installMcpForTool(tool) {
  const config = MCP_TARGETS[tool];

  if (!config) {
    return;
  }

  if (config.serverContainerKey) {
    await config.install(config.template, config.destination, config.serverContainerKey);
    return;
  }

  await config.install(config.template, config.destination);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const notes = [];

  for (const tool of options.tools) {
    if (options.installSkills) {
      const skillResult = await installSkillsForTool(tool);

      if (skillResult.installed.length > 0) {
        notes.push(`${tool}: installed skills ${skillResult.installed.join(", ")}`);
      }

      if (skillResult.note) {
        notes.push(`${tool}: ${skillResult.note}`);
      }
    }

    if (options.installMcp) {
      await installMcpForTool(tool);
      notes.push(`${tool}: installed MCP config at ${path.relative(ROOT, MCP_TARGETS[tool].destination)}`);
    }
  }

  process.stdout.write(`${notes.join("\n")}\n`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
