import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Prisma, Role } from '@prisma/client';
import { Namespace, Server, Socket } from 'socket.io';
import { RequireAgentAccess } from 'src/common/decorators/WsAgentAccess.decorator';
import { AgentAccessGuard } from 'src/common/guards/WsAgentGuard.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({
    namespace: '/ws/agents',
    cors: { origin: '*' },
})
@RequireAgentAccess()
@UseGuards(AgentAccessGuard)
export class WhatsappGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer()
    server!: Namespace;

    constructor(
        private readonly jwt: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    afterInit(server: Namespace) {
        server.use(async (socket: Socket, next) => {
            try {
                const token = socket.handshake.auth?.token
                    || socket.handshake.headers['authorization']?.toString().replace(/^Bearer\s+/i, '');

                if (!token) return next(new Error('Unauthorized'));

                const user = await this.jwt.verifyAsync(token);
                (socket as any).user = user

                const agentId = socket.handshake.query.agentId as string;
                if (!agentId) return next(new Error('AgentIdRequired'));

                const canAccess = await this.canUserAccessAgent(user, agentId);
                if (!canAccess) return next(new Error('Unauthorized'));

                (socket as any).agentId = agentId;

                next();
            } catch (err) {
                next(new Error("Unauthorized"));
            }
        })
    }

    private async canUserAccessAgent(user: any, agentId: string): Promise<boolean> {
        if(user.role === Role.ADMIN || user.role === Role.SUPERADMIN)
            return true;

        const isAnyConnection = await this.prisma.agent.count({
            where: {
                id: agentId,
                company: {
                    members: {
                        some: { id: user.id }
                    }
                }
            },
        });

        return isAnyConnection > 0
    }

    handleConnection(client: Socket) {
        const agentId = (client.handshake.query.agentId as string) || '';
        if (!agentId) {
            client.disconnect(true);
            return;
        }
        client.join(agentId);
    }

    emitStatus(agentId: string, payload: any) {
        console.log("what");
        this.server.to(agentId).emit('wapp:status', payload);
    }

    emitQr(agentId: string, payload: { dataUrl: string }) {
        this.server.to(agentId).emit('wapp:qr', payload);
    }

    emitError(agentId: string, payload: { message: string }) {
        this.server.to(agentId).emit('wapp:error', payload);
    }
}
