<script lang="ts" setup>
import type { OutputStreamItem } from '#/api';

import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { getActivities } from '#/api';

interface TerminalLine {
  at: string;
  kind: 'error' | 'output' | 'system';
  text: string;
}

const lines = ref<TerminalLine[]>([]);
const cursor = ref(0);
const terminalBody = ref<HTMLElement>();
let pollTimer: ReturnType<typeof setInterval> | undefined;

function scrollBottom() {
  void nextTick(() => {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
    }
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
}

function appendOutput(item: OutputStreamItem) {
  cursor.value = Math.max(cursor.value, item.cursor);
  lines.value.push({
    at: formatTime(item.at),
    kind: item.kind === 'error' ? 'error' : 'output',
    text: item.text,
  });
  scrollBottom();
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
    // Keep terminal log stream alive even when polling fails.
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
      <div v-if="!lines.length" class="terminal-muted">AuroraBot 运行日志</div>
      <div
        v-for="(line, index) in lines"
        :key="`${line.at}-${index}`"
        class="terminal-line"
        :class="`terminal-${line.kind}`"
      >
        <span class="terminal-time">{{ line.at }}</span>
        <span class="terminal-text whitespace-pre-wrap">{{ line.text }}</span>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.terminal-body {
  height: calc(100vh - 180px);
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

.terminal-muted {
  color: #565f89;
}

.terminal-output .terminal-text {
  color: #d4d4d4;
}

.terminal-error .terminal-text {
  color: #ff7b72;
}

.terminal-system .terminal-text {
  color: #79c0ff;
}
</style>
