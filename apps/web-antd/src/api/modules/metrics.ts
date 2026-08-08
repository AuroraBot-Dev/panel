import type { TimeRange } from '#/types/aurora';

import { requestClient } from '#/api/request';

export interface MetricsSummaryTransport {
  averageLatencyMs: number;
  cacheHitRate: number;
  cost: number;
  inputTokens: number;
  messages: number;
  outputTokens: number;
  requests: number;
  storage: Array<{ label: string; sizeBytes: number }>;
}

export interface TrendPointTransport {
  inputTokens: number;
  label: string;
  outputTokens: number;
  requests: number;
}

export function getMetricsSummaryApi(
  agentId: string,
  range: TimeRange,
  signal?: AbortSignal,
) {
  return requestClient.get<MetricsSummaryTransport>('/aurora/metrics/summary', {
    params: { agentId, range },
    signal,
  });
}

export function getMetricsTrendApi(
  agentId: string,
  range: TimeRange,
  signal?: AbortSignal,
) {
  return requestClient.get<TrendPointTransport[]>('/aurora/metrics/trend', {
    params: { agentId, range },
    signal,
  });
}
