import type { TerminalInputResult } from '../types';

import { operationRequest } from '../client';

export function sendTerminalInput(payload: {
  client_message_id?: string;
  session_id?: string;
  text: string;
}) {
  return operationRequest<TerminalInputResult>('POST', '/terminal/input', {
    data: payload,
  });
}
