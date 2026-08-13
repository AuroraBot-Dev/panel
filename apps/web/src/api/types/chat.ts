import type { CausalEvent } from './engine';

export interface OutputStreamItem {
  activity_id: string;
  at: string;
  cursor: number;
  kind: 'error' | 'model' | string;
  session_id: string;
  task_id: string;
  text: string;
}

export interface OutputStreamPage {
  items: OutputStreamItem[];
  next_cursor: number;
}

export interface SessionExport {
  events: CausalEvent[];
  outputs: Array<{
    activity_id: string;
    at: string;
    kind: string;
    task_id: string;
    text: string;
  }>;
  session_id: string;
}

export interface AttachmentRecord {
  attachment_id: string;
  created_at: string;
  mime: string;
  name: string;
  size: number;
  stored_name: string;
}

export interface WebSocketOutputEvent {
  item: OutputStreamItem;
  type: 'output';
}

export const PANEL_OWNER = 'panel:owner';
