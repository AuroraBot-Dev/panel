import type { PageQuery, PageResult } from '#/types/aurora';

export interface LogEntry {
  id: string;
  level: 'error' | 'info' | 'warn';
  message: string;
  timestamp: string;
}

export interface LogsApi {
  list(query: PageQuery): Promise<PageResult<LogEntry>>;
}
