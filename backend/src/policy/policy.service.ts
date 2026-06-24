import { Injectable } from "@nestjs/common";
import { GuardrailRule, RuleType } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PolicyService {
  private cachedRules: GuardrailRule[] = [];
  private lastFetch = 0;
  private readonly CACHE_TTL = 5000;

  constructor(private readonly prisma: PrismaService) {}

  private async getActiveRules() {
    const now = Date.now();

    if (now - this.lastFetch > this.CACHE_TTL) {
      this.cachedRules = await this.prisma.guardrailRule.findMany({
        where: { isActive: true },
      });
      this.lastFetch = now;
    }
    return this.cachedRules;
  }

  private validateInput(input: any, condition: string): boolean {
    const [field, rule] = condition.split(":");

    // field doesn't exist in input at all
    if (input[field] === undefined) return false;

    // startsWith check e.g. "path:/sandbox/"
    if (typeof input[field] === "string" && input[field].startsWith(rule)) {
      return true;
    }

    return false;
  }

  async checkToolCall(toolName: string, input: any, conversationId: string) {
    const rules = await this.getActiveRules();

    // 1. Block check
    const blockRule = rules.find((r) => r.ruleType === RuleType.BLOCK && r.toolName === toolName);

    if (blockRule) {
      return {
        allowed: false,
        reason: `${toolName} is blocked by admin`,
        requiresApproval: false,
      };
    }

    // 2. Input validation check
    const validationRules = rules.find(
      (r) => r.ruleType === RuleType.INPUT_VALIDATION && r.toolName === toolName,
    );

    if (validationRules && validationRules.condition) {
      const isValid = this.validateInput(input, validationRules.condition);

      if (!isValid) {
        return {
          allowed: false,
          reason: `Input validation failed: ${validationRules.condition}`,
          requiresApproval: false,
        };
      }
    }

    // 3. Token budget check
    const tokenRule = rules.find((r) => r.ruleType === RuleType.TOKEN_BUDGET);

    if (tokenRule?.condition) {
      const convo = await this.prisma.conversation.findUnique({ where: { id: conversationId } });

      if (!convo) {
        // conversation not found, skip budget check
        console.warn(`Conversation ${conversationId} not found for budget check`);
      }

      if (convo) {
        const maxTokens = parseInt(tokenRule.condition);

        if (convo.tokenCount >= maxTokens) {
          return {
            allowed: false,
            reason: `Token budget exceeded (${maxTokens})`,
            requiresApproval: false,
          };
        }
      }
    }

    // 4. Approval check
    const approvalRule = rules.find(
      (r) => r.ruleType === RuleType.APPROVAL && r.toolName === toolName,
    );

    if (approvalRule) {
      return {
        allowed: false,
        requiresApproval: true,
      };
    }

    return { allowed: true, requiresApproval: false };
  }

  invalidateCache() {
    this.lastFetch = 0;
  }
}
