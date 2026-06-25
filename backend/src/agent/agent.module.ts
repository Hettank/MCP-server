import { Module } from "@nestjs/common";
import { AgentService } from "./agent.service";
import { AgentController } from "./agent.controller";
import { McpModule } from "src/mcp/mcp.module";
import { PolicyModule } from "src/policy/policy.module";

@Module({
  imports: [McpModule, PolicyModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
