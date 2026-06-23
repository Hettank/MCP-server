import { RuleType } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateRuleDto {
  @IsString()
  @MaxLength(100)
  toolName!: string;

  @IsEnum(RuleType)
  ruleType!: RuleType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  condition?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
