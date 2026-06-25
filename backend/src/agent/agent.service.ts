import Groq from "groq-sdk";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from "groq-sdk/resources/chat/completions";
import { Injectable, Logger } from "@nestjs/common";
import { McpService } from "src/mcp/mcp.service";
import { PolicyService } from "src/policy/policy.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ChatDto } from "./dto/chat.dto";

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  private readonly groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  constructor(
    private readonly mcpService: McpService,
    private readonly policyService: PolicyService,
    private readonly prisma: PrismaService,
  ) {
    console.log("GROQ_API_KEY =", process.env.GROQ_API_KEY ? "***set***" : "NOT SET");
  }

  private async getOrCreateConversation(conversationId?: string) {
    if (conversationId) {
      const existing = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (existing) return existing;
    }

    return this.prisma.conversation.create({
      data: { title: "New conversation", tokenCount: 0 },
    });
  }

  private async logToolCall(
    conversationId: string,
    toolName: string,
    input: any,
    decision: { allowed: boolean; reason?: string; requiresApproval?: boolean },
  ) {
    const status = decision.requiresApproval
      ? "PENDING_APPROVAL"
      : decision.allowed
        ? "ALLOWED"
        : "BLOCKED";

    return this.prisma.toolCallLog.create({
      data: {
        conversationId,
        toolName,
        input,
        status,
        blockedReason: decision.reason ?? null,
        ...(decision.requiresApproval && {
          approval: {
            create: {}
          }
        }),
      },
    });
  }

  /**
   * Convert MCP tools ({ name, description, input_schema })
   * to OpenAI-compatible function-calling format used by Groq
   */
  private convertToolsForGroq(mcpTools: any[]): ChatCompletionTool[] {
    return mcpTools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema ?? {},
      },
    }));
  }

  private async runLoop(
    messages: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[],
    conversationId: string,
  ): Promise<string> {
    const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

    while (true) {
      // call Groq API
      const response = await this.groq.chat.completions.create({
        model,
        max_tokens: 512,
        tools,
        messages,
      });

      const choice = response.choices[0];

      // update token count in DB
      const tokenCount =
        (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          tokenCount: { increment: tokenCount },
        },
      });

      // Model is done — return final text
      if (choice.finish_reason === "stop") {
        return choice.message?.content ?? "Done.";
      }

      // Model wants to call tools
      if (choice.finish_reason === "tool_calls" && choice.message?.tool_calls) {
        const toolCalls = choice.message.tool_calls;
        const toolResults: ChatCompletionToolMessageParam[] = [];

        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          let args: any = {};

          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            this.logger.warn(
              `Failed to parse args for ${toolName}: ${toolCall.function.arguments}`,
            );
          }

          this.logger.log(`Groq wants to call: ${toolName}`);

          // check policy BEFORE executing
          const decision = await this.policyService.checkToolCall(toolName, args, conversationId);

          // log to DB
          await this.logToolCall(conversationId, toolName, args, decision);

          if (decision.requiresApproval) {
            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Tool "${toolName}" requires human approval. Please ask the admin to approve it from the dashboard.`,
            });
            continue;
          }

          if (!decision.allowed) {
            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Blocked by policy: ${decision.reason}`,
            });
            continue;
          }

          // policy approved — execute via MCP
          try {
            const result = await this.mcpService.executeTool(toolName, args ?? {});
            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          } catch (err) {
            this.logger.error(`Tool execution failed: ${toolName}`, err);
            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Tool execution failed: ${err.message}`,
            });
          }
        }

        // feed results back to Groq and loop again
        messages.push({
          role: "assistant",
          tool_calls: choice.message.tool_calls,
          content: choice.message.content,
        });
        messages.push(...toolResults);
      }
    }
  }

  async chat(dto: ChatDto) {
    // get or create conversation
    const convo = await this.getOrCreateConversation(dto.conversationId ?? undefined);

    // build message history
    const messages: ChatCompletionMessageParam[] = [{ role: "user", content: dto.message }];

    // get all available tools from MCP servers
    const mcpTools = this.mcpService.getAllTools();
    const tools = this.convertToolsForGroq(mcpTools);

    // run the tool-use loop
    const result = await this.runLoop(messages, tools, convo.id);

    return {
      conversationId: convo.id,
      response: result,
    };
  }
}
