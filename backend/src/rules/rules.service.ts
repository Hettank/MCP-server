import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRuleDto) {
    return this.prisma.guardrailRule.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.guardrailRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.guardrailRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException("Rule not found");
    }

    return rule;
  }

  async update(id: string, data: UpdateRuleDto) {
    await this.findOne(id);

    return this.prisma.guardrailRule.update({
      where: { id },
      data,
    });
  }

  async toggle(id: string) {
    const rule = await this.findOne(id);

    return this.prisma.guardrailRule.update({
      where: { id },
      data: {
        isActive: !rule.isActive,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.guardrailRule.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}
