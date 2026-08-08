import type { RequestClientOptions } from '@vben/request';

import { LOGIN_PATH } from '@vben/constants';
import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { resetAllStores, useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import type { OperationEnvelope } from '#/types/aurora';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function formatToken(token: null | string) {
  return token ? `Bearer ${token}` : null;
}

export async function clearPanelSession() {
  resetAllStores();
  const { router } = await import('#/router');
  if (router.currentRoute.value.path !== LOGIN_PATH) {
    await router.replace({
      path: LOGIN_PATH,
      query: {
        redirect: encodeURIComponent(router.currentRoute.value.fullPath),
      },
    });
  }
}

function errorText(error: any, fallback: string) {
  return (
    error?.response?.data?.detail ??
    error?.response?.data?.message ??
    error?.detail ??
    error?.message ??
    fallback
  );
}

function createBodyClient(
  baseURL: string,
  options: RequestClientOptions & { authenticated?: boolean } = {},
) {
  const { authenticated = false, ...clientOptions } = options;
  const client = new RequestClient({
    ...clientOptions,
    baseURL,
    responseReturn: 'body',
  });

  if (authenticated) {
    client.addRequestInterceptor({
      fulfilled: async (config) => {
        const accessStore = useAccessStore();
        if (
          accessStore.accessTokenExpiresAt &&
          Date.parse(accessStore.accessTokenExpiresAt) <= Date.now()
        ) {
          await clearPanelSession();
          throw new Error('Panel session expired');
        }
        config.headers.Authorization = formatToken(accessStore.accessToken);
        config.headers['Accept-Language'] = preferences.app.locale;
        return config;
      },
    });
    client.addResponseInterceptor({
      rejected: async (error) => {
        if (error?.response?.status === 401) await clearPanelSession();
        throw error;
      },
    });
  }

  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 'ok',
    }),
  );
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((fallback, error) => {
      message.error(errorText(error, fallback));
    }),
  );
  return client;
}

export const publicRequestClient = createBodyClient(apiURL);
export const panelRequestClient = createBodyClient(apiURL, {
  authenticated: true,
});

// Compatibility export for modules that use the shared authenticated client.
export const requestClient = panelRequestClient;
export const baseRequestClient = publicRequestClient;

export async function operationRequest<T extends object>(
  method: 'GET' | 'POST',
  path: string,
  options?: {
    data?: unknown;
    params?: Record<string, unknown>;
    signal?: AbortSignal;
  },
): Promise<T> {
  const envelope = await panelRequestClient.request<OperationEnvelope<T>>(
    `/ops${path}`,
    {
      data: options?.data,
      method,
      params: options?.params,
      responseReturn: 'body',
      signal: options?.signal,
    },
  );
  if (!envelope.ok || envelope.code !== 'ok' || envelope.data === null) {
    throw new Error(envelope.message || envelope.code || 'Operation failed');
  }
  return envelope.data;
}

export function panelApiUrl(path: string) {
  const base = new URL(apiURL, window.location.origin);
  const prefix = base.pathname.replace(/\/$/, '');
  base.pathname = `${prefix}${path.startsWith('/') ? path : `/${path}`}`;
  return base.toString();
}

export function panelRootUrl(path: string) {
  const base = new URL(apiURL, window.location.origin);
  base.pathname = path;
  base.search = '';
  return base.toString();
}

export function panelWebSocketUrl(token: string) {
  const explicit = import.meta.env.VITE_GLOB_WS_URL as string | undefined;
  const base = new URL(explicit || panelApiUrl('/ops/stream'));
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  base.searchParams.set('token', token);
  return base.toString();
}
