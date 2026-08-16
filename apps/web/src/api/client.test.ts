import { useAccessStore } from '@vben/stores';

import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  OFFLINE_PANEL_TOKEN,
  operationRequest,
  panelApiUrl,
  panelRequestClient,
  panelWebSocketUrl,
} from './client';

const replace = vi.fn();

vi.mock('#/adapter/naive', () => ({
  message: { error: vi.fn() },
}));

vi.mock('#/router', () => ({
  router: {
    currentRoute: { value: { fullPath: '/overview', path: '/overview' } },
    replace,
  },
}));

describe('panel API client', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    setActivePinia(createPinia());
    mock = new MockAdapter(panelRequestClient.instance);
    replace.mockClear();
  });

  it('adds the bearer token to authenticated requests', async () => {
    const accessStore = useAccessStore();
    accessStore.setAccessToken('session-token');
    accessStore.setAccessTokenExpiresAt(
      new Date(Date.now() + 60_000).toISOString(),
    );
    mock
      .onGet('/probe')
      .reply((config) => [
        200,
        { authorization: config.headers?.Authorization },
      ]);

    await expect(
      panelRequestClient.get<{ authorization: string }>('/probe', {
        responseReturn: 'body',
      }),
    ).resolves.toEqual({ authorization: 'Bearer session-token' });
  });

  it('does not send authenticated requests in offline mode', async () => {
    const accessStore = useAccessStore();
    accessStore.setAccessToken(OFFLINE_PANEL_TOKEN);
    accessStore.setAccessTokenExpiresAt('2099-12-31T23:59:59Z');
    mock.onGet('/ops/test').reply(200, { ok: true });

    await expect(panelRequestClient.get('/ops/test')).rejects.toThrow(
      'Offline mode: backend is not connected',
    );
    expect(mock.history.get).toHaveLength(0);
  });

  it('returns successful operation data and forwards request options', async () => {
    mock.onPost('/ops/messages', { text: 'hello' }).reply((config) => [
      200,
      {
        code: 'ok',
        data: { message_id: 'm-1', query: config.params.limit },
        message: null,
        ok: true,
      },
    ]);

    await expect(
      operationRequest<{ message_id: string; query: number }>(
        'POST',
        '/messages',
        { data: { text: 'hello' }, params: { limit: 2 } },
      ),
    ).resolves.toEqual({ message_id: 'm-1', query: 2 });
  });

  it.each([
    {
      code: 'NOT_FOUND',
      data: null,
      expected: 'missing',
      message: 'missing',
      ok: false,
    },
    { code: 'ok', data: null, expected: 'ok', message: null, ok: true },
  ])(
    'rejects an invalid operation envelope',
    async ({ expected, ...envelope }) => {
      mock.onGet('/ops/test').reply(200, envelope);
      await expect(operationRequest('GET', '/test')).rejects.toThrow(expected);
    },
  );

  it('surfaces HTTP errors from the backend', async () => {
    mock.onGet('/ops/test').reply(500, { detail: 'backend failed' });
    await expect(operationRequest('GET', '/test')).rejects.toMatchObject({
      detail: 'backend failed',
    });
  });

  it('builds API and WebSocket URLs from the configured API base', () => {
    const apiUrl = new URL(panelApiUrl('/ops'));
    const wsUrl = new URL(panelWebSocketUrl('a token'));
    expect(apiUrl.pathname).toBe('/api/ops');
    expect(wsUrl.pathname).toBe('/api/ops/stream');
    expect(wsUrl.protocol).toBe(apiUrl.protocol === 'https:' ? 'wss:' : 'ws:');
    expect(wsUrl.searchParams.get('token')).toBe('a token');
  });
});
