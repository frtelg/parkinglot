import {
  archiveParkingLotItem,
  createParkingLotComment,
  createParkingLotItem,
  deleteParkingLotComment,
  getParkingLotItemDetail,
  listParkingLotItems,
  resolveParkingLotItem,
  snoozeParkingLotItem,
  unarchiveParkingLotItem,
  updateParkingLotComment,
  updateParkingLotItem,
} from "./parking-lot.ts";
import {
  createCommentInputSchema,
  createItemInputSchema,
  itemViewSchema,
  snoozeItemInputSchema,
  updateCommentInputSchema,
  updateItemInputSchema,
} from "./schemas.ts";

type ToolDefinition = {
  description: string;
  inputSchema: Record<string, unknown>;
};

type MpcToolResponse = {
  content: Array<{
    type: "text";
    text: string;
  }>;
  structuredContent: unknown;
};

function asText(value: unknown) {
  return JSON.stringify(value, null, 2);
}

const toolDefinitions: Record<string, ToolDefinition> = {
  list_items: {
    description: "List parking lot items by lifecycle view.",
    inputSchema: {
      type: "object",
      properties: {
        view: { type: "string", enum: ["active", "snoozed", "resolved", "archived"] },
      },
      required: ["view"],
      additionalProperties: false,
    },
  },
  get_item: {
    description: "Get one parking lot item with its comment timeline.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  create_item: {
    description: "Create a parking lot item.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        details: { type: "string" },
      },
      required: ["title"],
      additionalProperties: false,
    },
  },
  update_item: {
    description: "Update a parking lot item's title or details.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        details: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  resolve_item: {
    description: "Mark a parking lot item as resolved.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  snooze_item: {
    description: "Snooze an active parking lot item until a future time.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        snoozedUntil: { type: "string", format: "date-time" },
      },
      required: ["id", "snoozedUntil"],
      additionalProperties: false,
    },
  },
  archive_item: {
    description: "Archive a parking lot item.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  unarchive_item: {
    description: "Unarchive a parking lot item.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  create_comment: {
    description: "Add a comment to an item.",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string" },
        body: { type: "string" },
        authorType: { type: "string", enum: ["human", "agent", "system"] },
        authorLabel: { type: "string" },
      },
      required: ["itemId", "body", "authorType"],
      additionalProperties: false,
    },
  },
  update_comment: {
    description: "Edit an existing comment on an item.",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string" },
        commentId: { type: "string" },
        body: { type: "string" },
      },
      required: ["itemId", "commentId", "body"],
      additionalProperties: false,
    },
  },
  delete_comment: {
    description: "Soft-delete a comment from an item timeline.",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string" },
        commentId: { type: "string" },
      },
      required: ["itemId", "commentId"],
      additionalProperties: false,
    },
  },
};

export function listMcpTools() {
  return Object.entries(toolDefinitions).map(([name, definition]) => ({
    name,
    description: definition.description,
    inputSchema: definition.inputSchema,
  }));
}

export function callMcpTool(name: string, args: Record<string, unknown>): MpcToolResponse {
  let structuredContent: unknown;

  switch (name) {
    case "list_items":
      structuredContent = listParkingLotItems(itemViewSchema.parse(args.view));
      break;
    case "get_item":
      structuredContent = getParkingLotItemDetail(String(args.id));
      break;
    case "create_item":
      structuredContent = createParkingLotItem(createItemInputSchema.parse(args));
      break;
    case "update_item":
      structuredContent = updateParkingLotItem(String(args.id), updateItemInputSchema.parse(args));
      break;
    case "resolve_item":
      structuredContent = resolveParkingLotItem(String(args.id));
      break;
    case "snooze_item":
      structuredContent = snoozeParkingLotItem(String(args.id), snoozeItemInputSchema.parse(args));
      break;
    case "archive_item":
      structuredContent = archiveParkingLotItem(String(args.id));
      break;
    case "unarchive_item":
      structuredContent = unarchiveParkingLotItem(String(args.id));
      break;
    case "create_comment":
      structuredContent = createParkingLotComment(String(args.itemId), createCommentInputSchema.parse(args));
      break;
    case "update_comment":
      structuredContent = updateParkingLotComment(
        String(args.itemId),
        String(args.commentId),
        updateCommentInputSchema.parse(args),
      );
      break;
    case "delete_comment":
      structuredContent = deleteParkingLotComment(String(args.itemId), String(args.commentId));
      break;
    default:
      throw new Error(`Unknown MCP tool: ${name}`);
  }

  return {
    content: [
      {
        type: "text",
        text: asText(structuredContent),
      },
    ],
    structuredContent,
  };
}
