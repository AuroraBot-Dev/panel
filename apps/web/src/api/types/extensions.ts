export interface ExtensionInfo {
  capabilities: string[];
  enabled: boolean;
  faces: string[];
  factory: string;
  id: string;
  version: string;
}

export interface ExtensionToggleResult {
  enabled: boolean;
  id: string;
  requires_restart: boolean;
}
