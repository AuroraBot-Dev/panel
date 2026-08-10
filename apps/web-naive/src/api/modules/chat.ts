import type {
  AttachmentRecord,
  OutputStreamPage,
  SessionExport,
} from '../types';

import { operationRequest } from '../client';

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
