import { Injectable } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer, OnGatewayInit } from "@nestjs/websockets";
import { Server } from "socket.io";
import { PolicyService } from "src/policy/policy.service";

@WebSocketGateway({
  cors: { origin: "*" },
})
@Injectable()
export class EventsGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly policyService: PolicyService) {}

  afterInit() {
    console.log("Websocket gateway initialized");
  }

  // called by RulesService after any rule change
  emitRulesUpdated() {
    // 1. bust the policy cache immediately on server side
    this.policyService.invalidateCache();

    // 2. emit to all connected frontend clients
    this.server.emit("rules:updated");

    console.log("Rules updated — cache busted, clients notified");
  }
}
