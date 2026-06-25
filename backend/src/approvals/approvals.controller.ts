import { Controller, Get, Param, Patch } from "@nestjs/common";
import { ApprovalsService } from "./approvals.service";

@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  findAllPending() {
    return this.approvalsService.findAllPending();
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string) {
    return this.approvalsService.approve(id);
  }

  @Patch(":id/reject")
  reject(@Param("id") id: string) {
    return this.approvalsService.reject(id);
  }
}
