import type { AppInfo } from './apps';
import type { JsonRecord } from './common';
import type { ExtensionInfo } from './extensions';

export interface AgentProfile {
  can_delegate: boolean;
  child_profiles: string[];
  id: string;
  model_role: string;
  triage_control: boolean;
}

export interface ConfigSnapshot {
  agents: AgentProfile[];
  apps: AppInfo[];
  console: JsonRecord;
  engine: JsonRecord;
  extensions: ExtensionInfo[];
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
