import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class WebsocketGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('terminal')
  handleTerminal(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // Terminal WebSocket logic
    client.emit('terminal-output', { data: `Received: ${data}` });
  }

  @SubscribeMessage('execution')
  handleExecution(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // Execution stream logic
    client.emit('execution-output', { data: 'Execution started...' });
  }

  broadcastTokenUpdate(userId: string, balance: number) {
    this.server.emit(`token-update-${userId}`, { balance });
  }
}
