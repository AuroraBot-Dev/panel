import type { MemoryHistory, MemorySearchResult, MemoryStatus } from '../types';

import { operationRequest } from '../client';

export function getMemoryStatus() {
  return operationRequest<MemoryStatus>('GET', '/memory/status');
}

export function getMemoryHistory(params?: { limit?: number; scope?: string }) {
  return operationRequest<MemoryHistory>('GET', '/memory/history', { params });
}

export async function searchMemory(params: {
  limit?: number;
  query: string;
  scope?: string;
}) {
  const data = await operationRequest<{
    count: number;
    results: MemorySearchResult[];
  }>('GET', '/memory/search', { params });
  return data.results;
}
