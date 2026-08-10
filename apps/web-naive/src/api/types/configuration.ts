import type { JsonRecord } from './common';

export interface AgentProfile {
  can_delegate: boolean;
  child_profiles: string[];
  id: string;
  model_role: string;
  triage_control: boolean;
}

export interface ConfigSnapshot {
  agents: AgentProfile[];
  console: JsonRecord;
  engine: JsonRecord;
  models: JsonRecord;
  panel: JsonRecord;
  profile: string;
  sources: JsonRecord[];
  storage: JsonRecord;
}

export interface PromptRecord {
  role: string;
  text: string;
}
