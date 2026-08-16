import { describe, expect, it } from 'vitest';

import {
  operationCoverage,
  operationCoverageKeys,
  operationKey,
} from './operation-coverage';

const backendOperations = [
  ['GET', '/'],
  ['GET', '/engine/status'],
  ['GET', '/engine/tasks'],
  ['GET', '/engine/tasks/{task_id}'],
  ['GET', '/engine/agents'],
  ['GET', '/engine/agents/{agent_id}'],
  ['GET', '/engine/events'],
  ['POST', '/engine/events'],
  ['GET', '/engine/sessions/{session_id}/export'],
  ['POST', '/engine/pump'],
  ['POST', '/engine/shutdown'],
  ['GET', '/memory/history'],
  ['GET', '/memory/search'],
  ['GET', '/memory/status'],
  ['GET', '/ai/cost'],
  ['GET', '/ai/models'],
  ['GET', '/ai/roles'],
  ['GET', '/agents/profiles'],
  ['GET', '/config/snapshot'],
  ['GET', '/prompts/{role}'],
  ['GET', '/messages'],
  ['POST', '/messages'],
  ['GET', '/activities'],
  ['POST', '/console/clear'],
  ['GET', '/console/log'],
  ['POST', '/console/log'],
  ['GET', '/extensions'],
  ['POST', '/extensions/{extension_id}/enabled'],
  ['GET', '/apps'],
  ['POST', '/apps/{package}/enabled'],
] as const;

describe('aurora operation coverage', () => {
  it('maps all 30 registered backend operations to a domain page', () => {
    expect(operationCoverage).toHaveLength(30);
    expect(operationCoverageKeys.size).toBe(30);
    expect(
      backendOperations.filter(
        ([method, path]) =>
          !operationCoverageKeys.has(operationKey(method, path)),
      ),
    ).toEqual([]);
  });
});
