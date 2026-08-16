<script lang="ts" setup>
import type { OutputStreamItem } from '#/api';

import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NInput } from 'naive-ui';

import { getActivities, sendTerminalInput } from '#/api';

interface TerminalLine {
  at: string;
  kind: 'error' | 'input' | 'output' | 'system';
  text: string;
}

const lines = ref<TerminalLine[]>([]);
const input = ref('');
const cursor = ref(0);
const sending = ref(false);
const terminalBody = ref<HTMLElement>();
let pollTimer: ReturnType<typeof setInterval> | undefined;

function scrollBottom() {
  void nextTick(() => {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
    }
  });
}

function push(line: TerminalLine) {
  lines.value.push(line);
  scrollBottom();
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
}

function appendOutput(item: OutputStreamItem) {
  cursor.value = Math.max(cursor.value, item.cursor);
  push({
    at: formatTime(item.at),
    kind: item.kind === 'error' ? 'error' : 'output',
    text: item.text,
  });
}

async function loadHistory() {
  try {
    const page = await getActivities(0, 200);
    page.items.forEach(appendOutput);
    cursor.value = page.next_cursor;
  } catch {
    // Global request handler reports transport errors.
  }
}

async function pollActivities() {
  try {
    const page = await getActivities(cursor.value, 64);
    page.items.forEach(appendOutput);
    cursor.value = page.next_cursor;
  } catch {
    // Keep terminal alive even when polling fails.
  }
}

async function submit() {
  const text = input.value.trim();
  if (!text || sending.value) return;
  input.value = '';
  sending.value = true;
  push({
    at: formatTime(new Date().toISOString()),
    kind: 'input',
    text: `> ${text}`,
  });
  try {
    const result = await sendTerminalInput({
      client_message_id: crypto.randomUUID(),
      session_id: 'panel:terminal',
      text,
    });
    if (result.control === 'clear_console') {
      lines.value = [];
      push({
        at: formatTime(new Date().toISOString()),
        kind: 'system',
        text: '[console cleared]',
      });
    } else if (result.text) {
      push({
        at: formatTime(new Date().toISOString()),
        kind: result.ok ? 'output' : 'error',
        text: result.text,
      });
    } else if (result.message_id) {
      push({
        at: formatTime(new Date().toISOString()),
        kind: 'system',
        text: `[submitted ${result.message_id}]`,
      });
    }
  } catch (submitError) {
    push({
      at: formatTime(new Date().toISOString()),
      kind: 'error',
      text: (submitError as Error).message,
    });
  } finally {
    sending.value = false;
    scrollBottom();
  }
}

onMounted(async () => {
  await loadHistory();
  pollTimer = setInterval(pollActivities, 2000);
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <Page>
    <div ref="terminalBody" class="terminal-body">
      <div v-if="!lines.length" class="terminal-muted">
        AuroraBot Terminal — 输入 /help 查看命令
      </div>
      <div
        v-for="(line, index) in lines"
        :key="`${line.at}-${index}`"
        class="terminal-line"
        :class="`terminal-${line.kind}`"
      >
        <span v-if="line.kind !== 'input'" class="terminal-time">
          {{ line.at }}
        </span>
        <span class="terminal-text whitespace-pre-wrap">{{ line.text }}</span>
      </div>
    </div>
    <div class="terminal-input">
      <span class="terminal-prompt">aurora&gt;</span>
      <NInput
        v-model:value="input"
        :autofocus="true"
        class="terminal-input-field"
        :disabled="sending"
        placeholder="输入命令或消息，Enter 发送"
        @keydown.enter.prevent="submit"
      />
    </div>
  </Page>
</template>

<style scoped>
.terminal-body {
  height: calc(100vh - 220px);
  min-height: 420px;
  padding: 16px;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #d4d4d4;
  background: #0d1117;
  border: 1px solid #21262d;
  border-radius: 8px;
}

.terminal-line {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.terminal-time {
  flex: none;
  color: #565f89;
}

.terminal-input {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  margin-top: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: #d4d4d4;
  background: #0d1117;
  border: 1px solid #21262d;
  border-radius: 8px;
}

.terminal-prompt {
  flex: none;
  color: #7ee787;
}

.terminal-input-field {
  font-family: inherit;
}

.terminal-input-field :deep(.n-input-wrapper) {
  background: transparent;
}

.terminal-input-field :deep(input) {
  font-family: inherit;
  color: #d4d4d4;
}

.terminal-muted {
  color: #565f89;
}

.terminal-output .terminal-text {
  color: #d4d4d4;
}

.terminal-input .terminal-text {
  color: #7ee787;
}

.terminal-error .terminal-text {
  color: #ff7b72;
}

.terminal-system .terminal-text {
  color: #79c0ff;
}
</style>
