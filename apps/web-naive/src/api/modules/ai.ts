import type { AiCost, JsonRecord } from '../types';

import { operationRequest } from '../client';

export function getAiCost() {
  return operationRequest<AiCost>('GET', '/ai/cost');
}

export async function getAiModels() {
  const data = await operationRequest<{ count: number; models: JsonRecord[] }>(
    'GET',
    '/ai/models',
  );
  return data.models;
}

export async function getAiRoles() {
  const data = await operationRequest<{ count: number; roles: JsonRecord[] }>(
    'GET',
    '/ai/roles',
  );
  return data.roles;
}
