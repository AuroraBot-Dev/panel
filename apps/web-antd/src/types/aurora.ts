export type AgentStatus = 'degraded' | 'offline' | 'online';
export type TimeRange = '7d' | '24h' | '30d';

export interface AgentSummary {
  features: string[];
  id: string;
  name: string;
  status: AgentStatus;
  uptimeSeconds: number;
  version: string;
}

export interface DashboardMetrics {
  averageLatencyMs: number;
  cacheHitRate: number;
  cost: number;
  inputTokens: number;
  messages: number;
  outputTokens: number;
  requests: number;
  storage: Array<{ label: string; sizeBytes: number }>;
}

export interface TrendPoint {
  inputTokens: number;
  label: string;
  outputTokens: number;
  requests: number;
}

export interface DashboardSnapshot {
  agents: AgentSummary[];
  metrics: DashboardMetrics;
  trend: TrendPoint[];
}

export interface PageQuery {
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}

export interface PageResult<T> {
  items: T[];
  total: number;
}

export interface ManagedResource {
  id: string;
  name: string;
  status: 'disabled' | 'enabled';
  updatedAt: string;
}
