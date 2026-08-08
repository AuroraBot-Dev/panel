import type { AgentStatus } from '#/types/aurora';

import { requestClient } from '#/api/request';

export interface AgentTransport {
  features: string[];
  id: string;
  name: string;
  status: AgentStatus;
  uptimeSeconds: number;
  version: string;
}

export function listAgentsApi(signal?: AbortSignal) {
  return requestClient.get<AgentTransport[]>('/aurora/agents', { signal });
}

export function restartAgentApi(agentId: string) {
  return requestClient.post<{ accepted: boolean }>(
    `/aurora/agents/${encodeURIComponent(agentId)}/restart`,
  );
}
