import { PolicyModule } from "src/policy/policy.module";
import { EventsGateway } from "./events.gateway";
import { Module } from "@nestjs/common";

@Module({
  imports: [PolicyModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class GatewayModule {}
