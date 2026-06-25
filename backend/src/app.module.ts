import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { RulesModule } from "./rules/rules.module";
import { PolicyModule } from "./policy/policy.module";
import { GatewayModule } from "./gateway/gateway.module";
import { McpModule } from "./mcp/mcp.module";
import { AgentModule } from "./agent/agent.module";

@Module({
  imports: [PrismaModule, RulesModule, PolicyModule, GatewayModule, McpModule, AgentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
