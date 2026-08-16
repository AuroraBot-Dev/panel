import type { AttachmentRecord } from '../types';

import { useAccessStore } from '@vben/stores';

import { clearPanelSession, isOfflinePanelToken, panelApiUrl } from '../client';

async function authenticatedFetch(path: string, init?: RequestInit) {
  const accessStore = useAccessStore();
  if (isOfflinePanelToken(accessStore.accessToken)) {
    throw new Error('Offline mode: backend is not connected');
  }
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
