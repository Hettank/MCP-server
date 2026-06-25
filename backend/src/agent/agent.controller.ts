import { Controller, Post, Body } from "@nestjs/common";
import { AgentService } from "./agent.service";
import { ChatDto } from "./dto/chat.dto";

@Controller("agent")
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post("chat")
  chat(@Body() dto: ChatDto) {
    return this.agentService.chat(dto);
  }
}
