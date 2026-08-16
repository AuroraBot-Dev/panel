export interface TerminalInputResult {
  control: string;
  data: null | Record<string, unknown>;
  message_id: null | string;
  ok: boolean;
  publish_reply: boolean;
  text: null | string;
}
