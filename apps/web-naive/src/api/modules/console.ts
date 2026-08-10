import type { JsonRecord } from '../types';

import { operationRequest } from '../client';

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
