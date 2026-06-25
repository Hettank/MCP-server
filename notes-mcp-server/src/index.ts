import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createNote,
  listNotes,
  readNote,
  editNote,
  deleteNote,
} from "./notes-store.js";

// create the MCP server
const server = new McpServer({
  name: "notes-mcp-server",
  version: "1.0.0",
});

// Tool 1: create_note
server.tool(
  "create_note",
  "Create a new note with a title and content",
  {
    title: z.string().describe("Title of the note"),
    content: z.string().describe("Content of the note"),
  },
  async ({ title, content }) => {
    const note = createNote(title, content);
    return {
      content: [
        {
          type: "text",
          text: `Note created successfully!\nID: ${note.id}\nTitle: ${note.title}`,
        },
      ],
    };
  },
);

// Tool 2: list_notes
server.tool("list_notes", "List all available notes", {}, async () => {
  const notes = listNotes();
  if (notes.length === 0) {
    return {
      content: [{ type: "text", text: "No notes found." }],
    };
  }
  const formatted = notes
    .map((n) => `ID: ${n.id}\nTitle: ${n.title}\nCreated: ${n.createdAt}`)
    .join("\n\n");

  return {
    content: [{ type: "text", text: formatted }],
  };
});

// Tool 3: read_note
server.tool(
  "read_note",
  "Read the full content of a specific note by ID",
  {
    id: z.string().describe("The ID of the note to read"),
  },
  async ({ id }) => {
    const note = readNote(id);
    if (!note) {
      return {
        content: [{ type: "text", text: `Note with ID ${id} not found.` }],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `Title: ${note.title}\nContent: ${note.content}\nUpdated: ${note.updatedAt}`,
        },
      ],
    };
  },
);

// Tool 4: edit_note
server.tool(
  "edit_note",
  "Edit the title or content of an existing note",
  {
    id: z.string().describe("The ID of the note to edit"),
    title: z.string().optional().describe("New title (optional)"),
    content: z.string().optional().describe("New content (optional)"),
  },
  async ({ id, title, content }) => {
    const note = editNote(id, title, content);
    if (!note) {
      return {
        content: [{ type: "text", text: `Note with ID ${id} not found.` }],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `Note updated!\nTitle: ${note.title}\nContent: ${note.content}`,
        },
      ],
    };
  },
);

// Tool 5: delete_note
server.tool(
  "delete_note",
  "Delete a note by ID",
  {
    id: z.string().describe("The ID of the note to delete"),
  },
  async ({ id }) => {
    const deleted = deleteNote(id);
    if (!deleted) {
      return {
        content: [{ type: "text", text: `Note with ID ${id} not found.` }],
      };
    }
    return {
      content: [{ type: "text", text: `Note ${id} deleted successfully.` }],
    };
  },
);

// start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Notes MCP server running on stdio");
}

main().catch(console.error);
