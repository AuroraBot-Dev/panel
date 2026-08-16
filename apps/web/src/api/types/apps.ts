export interface AppInfo {
  auth_env: null | string;
  command: string[];
  enabled: boolean;
  env: string[];
  package: string;
  timeout_seconds: number;
  transport: string;
  url: null | string;
  working_dir: null | string;
}

export interface AppToggleResult {
  enabled: boolean;
  package: string;
  requires_restart: boolean;
}
