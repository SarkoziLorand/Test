import { 
  CanActivate, 
  ExecutionContext, 
  Injectable,
  UnauthorizedException,
  ForbiddenException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AGENT_ACCESS_KEY } from '../decorators/WsAgentAccess.decorator';

@Injectable()
export class AgentAccessGuard implements CanActivate {

    constructor(
        private readonly reflector: Reflector,
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        console.log("adfafsdafd");
        const requiresAgentAccess = this.reflector.getAllAndOverride<boolean>(
            AGENT_ACCESS_KEY,
            [context.getHandler(), context.getClass()]
        );

        if(!requiresAgentAccess) return true;

        const client = context.switchToWs().getClient();

        const user = client.user;
        if(!user) {
            throw new ForbiddenException("User not authenticated");
        }

        console.log(`from funny auth stuff deco ${user}`);

        const agentId = client.handshake.query.agentId as string;
        if(!agentId) {
            throw new ForbiddenException("Agent Id is required");
        }

        const hasAccess = await this.checkAgentAccess(user, agentId);

        if(!hasAccess) {
            throw new ForbiddenException(`Access denied to agent ${agentId}`);
        }

        return true;
    }

    private async checkAgentAccess(user: any , agentId: string) : Promise<boolean> {
        return true;
    }
}