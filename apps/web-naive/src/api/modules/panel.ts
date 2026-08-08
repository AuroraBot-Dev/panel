import type {
  AgentDetail,
  AgentProfile,
  AgentTransport,
  AiCost,
  AttachmentRecord,
  CausalEvent,
  ConfigSnapshot,
  EngineStatus,
  JsonRecord,
  MemoryHistory,
  MemorySearchResult,
  MemoryStatus,
  OperationCatalog,
  OutputStreamPage,
  PromptRecord,
  SessionExport,
  TaskDetail,
  TaskStatus,
  TaskTransport,
} from '#/types/aurora';

import { useAccessStore } from '@vben/stores';

import {
  clearPanelSession,
  operationRequest,
  panelApiUrl,
  panelRequestClient,
} from '#/api/request';

export async function getOperationCatalog() {
  return panelRequestClient.get<OperationCatalog>('/ops', {
    responseReturn: 'body',
  });
}

export function getSystemInfo() {
  return operationRequest<OperationCatalog>('GET', '/');
}

export async function getEngineStatus() {
  const data = await operationRequest<{ status: EngineStatus }>(
    'GET',
    '/engine/status',
  );
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

export function getAiCost() {
  return operationRequest<AiCost>('GET', '/ai/cost');
}

export async function getAiModels() {
  const data = await operationRequest<{ count: number; models: JsonRecord[] }>(
    'GET',
    '/ai/models',
  );
  return data.models;
}

export async function getAiRoles() {
  const data = await operationRequest<{ count: number; roles: JsonRecord[] }>(
    'GET',
    '/ai/roles',
  );
  return data.roles;
}

export async function getAgentProfiles() {
  const data = await operationRequest<{ profiles: AgentProfile[] }>(
    'GET',
    '/agents/profiles',
  );
  return data.profiles;
}

export function getConfigSnapshot() {
  return operationRequest<ConfigSnapshot>('GET', '/config/snapshot');
}

export function getPrompt(role: string) {
  return operationRequest<PromptRecord>(
    'GET',
    `/prompts/${encodeURIComponent(role)}`,
  );
}

export function getMessages(sessionId: string, limit = 200) {
  return operationRequest<SessionExport>('GET', '/messages', {
    params: { limit, session_id: sessionId },
  });
}

export function sendMessage(payload: {
  attachments?: AttachmentRecord[];
  client_message_id: string;
  session_id: string;
  text: string;
}) {
  return operationRequest<{ message_id: string; session_id: string }>(
    'POST',
    '/messages',
    { data: payload },
  );
}

export function getActivities(cursor = 0, limit = 64) {
  return operationRequest<OutputStreamPage>('GET', '/activities', {
    params: { cursor, limit },
  });
}

export function getConsoleLogStatus() {
  return operationRequest<JsonRecord>('GET', '/console/log');
}

export function setConsoleLog(enabled: boolean) {
  return operationRequest<{ enabled: boolean }>('POST', '/console/log', {
    data: { enabled },
  });
}

export function clearConsole() {
  return operationRequest<{ cleared: boolean; control: string }>(
    'POST',
    '/console/clear',
    { data: {} },
  );
}

async function authenticatedFetch(path: string, init?: RequestInit) {
  const accessStore = useAccessStore();
  const headers = new Headers(init?.headers);
  if (accessStore.accessToken) {
    headers.set('Authorization', `Bearer ${accessStore.accessToken}`);
  }
  const response = await fetch(panelApiUrl(path), { ...init, headers });
  if (response.status === 401) await clearPanelSession();
  return response;
}

export async function uploadAttachment(file: File) {
  const body = new FormData();
  body.append('file', file);
  const response = await authenticatedFetch('/ops/attachments', {
    body,
    method: 'POST',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || `HTTP ${response.status}`);
  return result.attachment as AttachmentRecord;
}

export async function downloadAttachment(attachmentId: string) {
  const response = await authenticatedFetch(
    `/ops/attachments/${encodeURIComponent(attachmentId)}/download`,
  );
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.detail || `HTTP ${response.status}`);
  }
  return {
    blob: await response.blob(),
    contentDisposition: response.headers.get('content-disposition'),
  };
}
