import type {
  AgentSummary,
  DashboardMetrics,
  DashboardSnapshot,
  TimeRange,
  TrendPoint,
} from '#/types/aurora';

import {
  getMetricsSummaryApi,
  getMetricsTrendApi,
  listAgentsApi,
  restartAgentApi,
} from '#/api/modules';

export async function getDashboardSnapshot(
  agentId: string | undefined,
  range: TimeRange,
  signal?: AbortSignal,
): Promise<DashboardSnapshot> {
  const agents = await listAgentsApi(signal);
  const selectedId = agentId ?? agents[0]?.id;
  if (!selectedId) {
    return { agents: [], metrics: emptyMetrics(), trend: [] };
  }
  const [metrics, trend] = await Promise.all([
    getMetricsSummaryApi(selectedId, range, signal),
    getMetricsTrendApi(selectedId, range, signal),
  ]);
  return {
    agents: agents.map((agent): AgentSummary => ({ ...agent })),
    metrics: { ...metrics },
    trend: trend.map((point): TrendPoint => ({ ...point })),
  };
}

export function requestAgentRestart(agentId: string) {
  return restartAgentApi(agentId);
}

function emptyMetrics(): DashboardMetrics {
  return {
    averageLatencyMs: 0,
    cacheHitRate: 0,
    cost: 0,
    inputTokens: 0,
    messages: 0,
    outputTokens: 0,
    requests: 0,
    storage: [],
  };
}
