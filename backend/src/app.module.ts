import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { RulesModule } from "./rules/rules.module";
import { PolicyModule } from "./policy/policy.module";

@Module({
  imports: [PrismaModule, RulesModule, PolicyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
