import { Module } from "@nestjs/common";
import { ApprovalsController } from "./approvals.controller";
import { ApprovalsService } from "./approvals.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { EventsGateway } from "src/gateway/events.gateway";
import { PolicyService } from "src/policy/policy.service";

@Module({
  imports: [PrismaModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, EventsGateway, PolicyService],
})
export class ApprovalsModule {}
