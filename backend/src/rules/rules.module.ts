import { Module } from "@nestjs/common";
import { RulesService } from "./rules.service";
import { RulesController } from "./rules.controller";
import { GatewayModule } from "src/gateway/gateway.module";

@Module({
  imports: [GatewayModule],
  controllers: [RulesController],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}
