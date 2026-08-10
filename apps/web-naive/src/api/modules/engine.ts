import type {
  AgentDetail,
  AgentTransport,
  CausalEvent,
  JsonRecord,
  SessionExport,
  TaskDetail,
  TaskStatus,
  TaskTransport,
} from '../types';

import { operationRequest } from '../client';

export async function getEngineStatus() {
  const data = await operationRequest<{
    status: import('../types').EngineStatus;
  }>('GET', '/engine/status');
  return data.status;
}

export async function listTasks(params?: {
  limit?: number;
  status?: string | TaskStatus;
}) {
  const data = await operationRequest<{
    count: number;
    tasks: TaskTransport[];
  }>('GET', '/engine/tasks', { params });
  return data.tasks;
}

export function getTask(taskId: string) {
  return operationRequest<TaskDetail>(
    'GET',
    `/engine/tasks/${encodeURIComponent(taskId)}`,
  );
}

export async function listAgents(limit = 64) {
  const data = await operationRequest<{
    agents: AgentTransport[];
    count: number;
  }>('GET', '/engine/agents', { params: { limit } });
  return data.agents;
}

export function getAgent(agentId: string) {
  return operationRequest<AgentDetail>(
    'GET',
    `/engine/agents/${encodeURIComponent(agentId)}`,
  );
}

export async function listEvents(params?: {
  after_id?: number;
  event_type?: string;
  limit?: number;
  session_id?: string;
  task_id?: string;
}) {
  const data = await operationRequest<{ count: number; events: CausalEvent[] }>(
    'GET',
    '/engine/events',
    { params },
  );
  return data.events;
}

export function injectEvent(amp: Record<string, unknown>) {
  return operationRequest<{ message_id: string }>('POST', '/engine/events', {
    data: { amp },
  });
}

export function exportSession(sessionId: string) {
  return operationRequest<SessionExport>(
    'GET',
    `/engine/sessions/${encodeURIComponent(sessionId)}/export`,
  );
}

export function pumpEngine(maxTurns: number) {
  return operationRequest<JsonRecord>('POST', '/engine/pump', {
    data: { max_turns: maxTurns },
  });
}

export function shutdownEngine() {
  return operationRequest<{ control: string; shutdown: boolean }>(
    'POST',
    '/engine/shutdown',
    { data: {} },
  );
}
