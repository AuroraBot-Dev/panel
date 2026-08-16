/** Maps each registered backend operation to its owning panel feature. */
export interface OperationCoverage {
  feature: string;
  method: 'GET' | 'POST';
  path: string;
  route: string;
}

export const operationCoverage: OperationCoverage[] = [
  {
    feature: 'Operation catalog',
    method: 'GET',
    path: '/',
    route: '/operations/diagnostics',
  },
  {
    feature: 'Engine status',
    method: 'GET',
    path: '/engine/status',
    route: '/overview',
  },
  {
    feature: 'Task list',
    method: 'GET',
    path: '/engine/tasks',
    route: '/observation',
  },
  {
    feature: 'Task detail',
    method: 'GET',
    path: '/engine/tasks/{task_id}',
    route: '/observation',
  },
  {
    feature: 'Agent list',
    method: 'GET',
    path: '/engine/agents',
    route: '/observation',
  },
  {
    feature: 'Agent detail',
    method: 'GET',
    path: '/engine/agents/{agent_id}',
    route: '/observation',
  },
  {
    feature: 'Event list',
    method: 'GET',
    path: '/engine/events',
    route: '/observation',
  },
  {
    feature: 'AMP injection',
    method: 'POST',
    path: '/engine/events',
    route: '/operations/diagnostics',
  },
  {
    feature: 'Session export',
    method: 'GET',
    path: '/engine/sessions/{session_id}/export',
    route: '/chat/conversations',
  },
  {
    feature: 'Engine pump',
    method: 'POST',
    path: '/engine/pump',
    route: '/operations/diagnostics',
  },
  {
    feature: 'Engine shutdown',
    method: 'POST',
    path: '/engine/shutdown',
    route: '/operations/diagnostics',
  },
  {
    feature: 'Memory history',
    method: 'GET',
    path: '/memory/history',
    route: '/resources/memory',
  },
  {
    feature: 'Memory search',
    method: 'GET',
    path: '/memory/search',
    route: '/resources/memory',
  },
  {
    feature: 'Memory status',
    method: 'GET',
    path: '/memory/status',
    route: '/resources/memory',
  },
  {
    feature: 'AI cost',
    method: 'GET',
    path: '/ai/cost',
    route: '/configuration/models',
  },
  {
    feature: 'AI models',
    method: 'GET',
    path: '/ai/models',
    route: '/configuration/models',
  },
  {
    feature: 'AI roles',
    method: 'GET',
    path: '/ai/roles',
    route: '/configuration/models',
  },
  {
    feature: 'Agent profiles',
    method: 'GET',
    path: '/agents/profiles',
    route: '/configuration/agent',
  },
  {
    feature: 'Config snapshot',
    method: 'GET',
    path: '/config/snapshot',
    route: '/configuration/agent',
  },
  {
    feature: 'Prompt viewer',
    method: 'GET',
    path: '/prompts/{role}',
    route: '/configuration/prompts',
  },
  {
    feature: 'Message history',
    method: 'GET',
    path: '/messages',
    route: '/chat/console',
  },
  {
    feature: 'Send message',
    method: 'POST',
    path: '/messages',
    route: '/chat/console',
  },
  {
    feature: 'Activity stream',
    method: 'GET',
    path: '/activities',
    route: '/operations/logs',
  },
  {
    feature: 'Clear console',
    method: 'POST',
    path: '/console/clear',
    route: '/operations/logs',
  },
  {
    feature: 'Console log status',
    method: 'GET',
    path: '/console/log',
    route: '/operations/logs',
  },
  {
    feature: 'Console log toggle',
    method: 'POST',
    path: '/console/log',
    route: '/operations/logs',
  },
  {
    feature: 'Extension list',
    method: 'GET',
    path: '/extensions',
    route: '/extensions/plugins',
  },
  {
    feature: 'Extension toggle',
    method: 'POST',
    path: '/extensions/{extension_id}/enabled',
    route: '/extensions/plugins',
  },
  {
    feature: 'App list',
    method: 'GET',
    path: '/apps',
    route: '/extensions/apps',
  },
  {
    feature: 'App toggle',
    method: 'POST',
    path: '/apps/{package}/enabled',
    route: '/extensions/apps',
  },
  {
    feature: 'Terminal input',
    method: 'POST',
    path: '/terminal/input',
    route: '/operations/logs',
  },
];

export function operationKey(method: string, path: string) {
  return `${method.toUpperCase()} ${path}`;
}

export const operationCoverageKeys = new Set(
  operationCoverage.map(({ method, path }) => operationKey(method, path)),
);
