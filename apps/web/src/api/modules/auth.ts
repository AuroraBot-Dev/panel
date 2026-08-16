import type { PanelHealth, PanelSession } from '../types';

import { useAccessStore } from '@vben/stores';

import {
  isOfflinePanelToken,
  panelRequestClient,
  panelRootUrl,
  publicRequestClient,
} from '../client';

export namespace AuthApi {
  export interface LoginParams {
    token_login: string;
  }
}

function assertBackendConnected() {
  if (isOfflinePanelToken(useAccessStore().accessToken)) {
    throw new Error('Offline mode: backend is not connected');
  }
}

export function loginApi(data: AuthApi.LoginParams) {
  return publicRequestClient.post<PanelSession>('/auth/login', data, {
    responseReturn: 'body',
  });
}

export function logoutApi() {
  return panelRequestClient.post('/auth/logout', undefined, {
    responseReturn: 'body',
  });
}

export async function getApiHealth() {
  assertBackendConnected();
  return publicRequestClient.get<PanelHealth>('/health', {
    responseReturn: 'body',
  });
}

export async function getRootHealth() {
  assertBackendConnected();
  const response = await fetch(panelRootUrl('/healthz'));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as PanelHealth;
}
