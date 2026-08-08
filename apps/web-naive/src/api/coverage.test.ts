import { describe, expect, it } from 'vitest';

import {
  operationCoverage,
  operationCoverageKeys,
  operationKey,
} from './coverage';

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
] as const;

describe('aurora operation coverage', () => {
  it('maps all 26 registered backend operations to a domain page', () => {
    expect(operationCoverage).toHaveLength(26);
    expect(operationCoverageKeys.size).toBe(26);
    expect(
      backendOperations.filter(
        ([method, path]) =>
          !operationCoverageKeys.has(operationKey(method, path)),
      ),
    ).toEqual([]);
  });
});
