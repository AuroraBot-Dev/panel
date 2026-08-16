import type { ExtensionInfo, ExtensionToggleResult } from '../types';

import { operationRequest } from '../client';

export async function listExtensions() {
  const data = await operationRequest<{
    count: number;
    extensions: ExtensionInfo[];
  }>('GET', '/extensions');
  return data.extensions;
}

export function setExtensionEnabled(extensionId: string, enabled: boolean) {
  return operationRequest<ExtensionToggleResult>(
    'POST',
    `/extensions/${encodeURIComponent(extensionId)}/enabled`,
    { data: { enabled } },
  );
}
