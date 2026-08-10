import type { AgentProfile, ConfigSnapshot, PromptRecord } from '../types';

import { operationRequest } from '../client';

export async function getAgentProfiles() {
  const data = await operationRequest<{ profiles: AgentProfile[] }>(
    'GET',
    '/agents/profiles',
  );
  return data.profiles;
}

export function getConfigSnapshot() {
  return operationRequest<ConfigSnapshot>('GET', '/config/snapshot');
}

export function getPrompt(role: string) {
  return operationRequest<PromptRecord>(
    'GET',
    `/prompts/${encodeURIComponent(role)}`,
  );
}
