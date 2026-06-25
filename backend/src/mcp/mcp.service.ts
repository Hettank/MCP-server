import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

interface McpTool {
  name: string;
  description: string;
  input_schema: any;
}

@Injectable()
export class McpService implements OnModuleInit {
  private readonly logger = new Logger(McpService.name);

  // all discovered tools → given to Claude
  private tools: McpTool[] = [];

  // map of toolName → which MCP client handles it
  private toolClientMap = new Map<string, Client>();

  async onModuleInit() {
    await this.connectAll();
  }

  private async connectAll() {
    // await this.connectContext7();
    await this.connectNotesMcp();
  }

  // connect to context7 (remote SSE)
  private async connectContext7() {
    try {
      const client = new Client({ name: "armoriq-agent", version: "1.0.0" }, { capabilities: {} });

      const transport = new SSEClientTransport(new URL("https://mcp.context7.com/sse"));

      await client.connect(transport);
      await this.registerTools(client, "context7");
      this.logger.log("Connected to context7 MCP");
    } catch (err) {
      this.logger.error("Failed to connect to context7", err);
    }
  }

  // connect to your custom notes MCP (local stdio)
  private async connectNotesMcp() {
    try {
      const client = new Client(
        {
          name: "armoriq-agent",
          version: "1.0.0",
        },
        {
          capabilities: {},
        },
      );

      const serverPath = path.resolve(process.cwd(), "../notes-mcp-server/dist/index.js");

      console.log("cwd =", process.cwd());

      console.log("MCP Server Path:", serverPath);

      const transport = new StdioClientTransport({
        command: "node",
        args: [serverPath],
      });

      await client.connect(transport);

      await this.registerTools(client, "notes-mcp");

      this.logger.log("Connected to notes MCP server");
    } catch (err) {
      this.logger.error("Failed to connect to notes MCP", err);
    }
  }

  // discover tools from a server and register them
  private async registerTools(client: Client, serverName: string) {
    const { tools } = await client.listTools();

    for (const tool of tools) {
      // add to tool list for Claude
      this.tools.push({
        name: tool.name,
        description: tool.description ?? "",
        input_schema: tool.inputSchema,
      });

      // remember which client handles this tool
      this.toolClientMap.set(tool.name, client);
    }

    this.logger.log(
      `Registered ${tools.length} tools from ${serverName}: ${tools.map((t) => t.name).join(", ")}`,
    );
  }

  // called by agent to get all tools for Claude
  getAllTools(): McpTool[] {
    return this.tools;
  }

  // called by agent to execute a tool after policy approves
  async executeTool(toolName: string, input: any): Promise<any> {
    const client = this.toolClientMap.get(toolName);

    if (!client) {
      throw new Error(`No MCP server found for tool: ${toolName}`);
    }

    const result = await client.callTool({
      name: toolName,
      arguments: input,
    });

    return result.content;
  }
}
