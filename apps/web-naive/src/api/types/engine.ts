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
