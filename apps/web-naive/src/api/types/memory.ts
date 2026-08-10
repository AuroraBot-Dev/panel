export interface MemoryStatus {
  enabled: boolean;
  facts: number;
  scopes: string[];
  summaries: number;
  window_messages: number;
}

export interface MemoryHistory {
  facts: Array<{
    content: string;
    created_at: string;
    scope: string;
    source_task_id: string;
  }>;
  scope: null | string;
  summaries: Array<{ scope: string; summary: string; updated_at: string }>;
  window: Array<{ at: string; content: string; role: string; scope: string }>;
}

export interface MemorySearchResult {
  at?: string;
  content: string;
  created_at?: string;
  hits: number;
  kind: 'fact' | 'window';
  role?: string;
  scope: string;
  source_task_id?: string;
}
