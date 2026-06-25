import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ApprovalStatus, CallStatus } from "@prisma/client";

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPending() {
    return this.prisma.approvalRequest.findMany({
      where: {
        status: ApprovalStatus.PENDING,
      },
      include: {
        toolCallLog: true,
      },
      orderBy: {
        requestedAt: "desc",
      },
    });
  }

  async approve(id: string) {
    const approval = await this.prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!approval) {
      throw new NotFoundException("Approval request not found");
    }

    const updated = await this.prisma.approvalRequest.update({
      where: { id },
      data: {
        status: ApprovalStatus.APPROVED,
        resolvedAt: new Date(),
        toolCallLog: {
          update: {
            status: CallStatus.ALLOWED,
          },
        },
      },
      include: {
        toolCallLog: true,
      },
    });

    return updated;
  }

  async reject(id: string) {
    const approval = await this.prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!approval) {
      throw new NotFoundException("Approval request not found");
    }

    const updated = await this.prisma.approvalRequest.update({
      where: { id },
      data: {
        status: ApprovalStatus.DENIED,
        resolvedAt: new Date(),
        toolCallLog: {
          update: {
            status: CallStatus.BLOCKED,
            blockedReason: "Rejected by admin",
          },
        },
      },
      include: {
        toolCallLog: true,
      },
    });

    return updated;
  }
}
