import type { AppInfo, AppToggleResult } from '../types';

import { operationRequest } from '../client';

export async function listApps() {
  const data = await operationRequest<{ apps: AppInfo[]; count: number }>(
    'GET',
    '/apps',
  );
  return data.apps;
}

export function setAppEnabled(packageName: string, enabled: boolean) {
  return operationRequest<AppToggleResult>(
    'POST',
    `/apps/${encodeURIComponent(packageName)}/enabled`,
    { data: { enabled } },
  );
}
