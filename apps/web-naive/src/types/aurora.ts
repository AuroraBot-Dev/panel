export interface PanelHealth {
  ok: boolean;
  profile: string;
  status: string;
}

export interface PanelSession {
  created_at: string;
  expires_at: string;
  token: string;
}

export interface OperationEnvelope<T extends object = Record<string, unknown>> {
  code: string;
  data: null | T;
  message: null | string;
  ok: boolean;
}

export type OperationScope = 'all' | 'console_only';
export type ParameterLocation = 'body' | 'path' | 'query';

export interface ParameterSpec {
  default: unknown;
  kind: 'flag' | 'named' | 'positional';
  location: ParameterLocation;
  name: string;
  required: boolean;
  type: 'bool' | 'float' | 'int' | 'json' | 'str';
}

export interface OperationSpec {
  aliases: string[];
  method: 'GET' | 'POST';
  name: string;
  parameters: ParameterSpec[];
  path: string;
  scope: OperationScope;
  summary: string;
}

export interface OperationCatalog {
  count: number;
  operations: OperationSpec[];
}

export interface EngineStatus {
  active_agents: number;
  active_model_activities: number;
  active_tasks: number;
  due_inbox_sessions: number;
  inbox_events: number;
  model_dispatch_active: boolean;
  pending_activities: number;
  pending_messages: number;
  pending_model_activities: number;
  pending_tool_activities: number;
}

export type TaskStatus =
  | 'ACTIVE'
  | 'BUDGET_EXHAUSTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'ERROR'
  | 'SILENT';

export interface TaskTransport {
  autonomous: boolean;
  max_duration_seconds: number;
  max_model_calls: number;
  max_tool_calls: number;
  model_calls: number;
  root_agent_id: string;
  root_message_id: string;
  root_summary: string;
  session_id: string;
  started_at: string;
  status: TaskStatus;
  task_id: string;
  termination_reason: null | string;
  tool_calls: number;
  updated_at: string;
}

export type AgentStatus = 'CANCELLED' | 'COMPLETED' | 'FAILED' | 'READY';

export interface AgentTransport {
  agent_id: string;
  assignment: string;
  created_at: string;
  depth: number;
  last_summary: string;
  parent_agent_id: null | string;
  profile_id: string;
  state: Record<string, unknown>;
  status: AgentStatus;
  task_id: string;
  updated_at: string;
}

export interface CausalEvent {
  agent_id: null | string;
  causation_id: null | string;
  correlation_id: null | string;
  created_at: string;
  event_id: string;
  payload: Record<string, unknown>;
  summary: string;
  task_id: null | string;
  type: string;
}

export interface TaskDetail {
  agents: AgentTransport[];
  budget: {
    max_duration_seconds: number;
    max_model_calls: number;
    max_tool_calls: number;
    model_calls: number;
    tool_calls: number;
  };
  causal_summary: Array<
    Pick<
      CausalEvent,
      | 'agent_id'
      | 'causation_id'
      | 'created_at'
      | 'event_id'
      | 'summary'
      | 'type'
    >
  >;
  events: CausalEvent[];
  supervision_tree: Array<AgentTransport & { children: AgentTransport[] }>;
  task: TaskTransport;
}

export interface AgentMessage {
  causation_id: null | string;
  correlation_id: string;
  created_at: string;
  message_id: string;
  payload_keys: string[];
  priority: number;
  status: string;
  task_id: string;
  type: string;
}

export interface AgentDetail {
  agent: AgentTransport;
  children: AgentTransport[];
  messages: AgentMessage[];
}

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

export interface AiCost {
  by_model: Record<string, number>;
  by_role: Record<string, number>;
  by_status: Record<string, number>;
  total_cost: number;
}

export type JsonRecord = Record<string, unknown>;

export interface AgentProfile {
  can_delegate: boolean;
  child_profiles: string[];
  id: string;
  model_role: string;
  triage_control: boolean;
}

export interface ConfigSnapshot {
  agents: AgentProfile[];
  console: JsonRecord;
  engine: JsonRecord;
  models: JsonRecord;
  panel: JsonRecord;
  profile: string;
  sources: JsonRecord[];
  storage: JsonRecord;
}

export interface PromptRecord {
  role: string;
  text: string;
}

export interface WebSocketOutputEvent {
  item: OutputStreamItem;
  type: 'output';
}

export const PANEL_OWNER = 'panel:owner';

// Shared list contracts retained for backend domains that are still placeholders.
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
