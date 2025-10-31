import { SetMetadata } from "@nestjs/common";

export const AGENT_ACCESS_KEY = 'agent-access';
export const RequireAgentAccess = () => SetMetadata(AGENT_ACCESS_KEY, true);