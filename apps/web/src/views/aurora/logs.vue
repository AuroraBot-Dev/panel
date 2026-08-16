<script lang="ts" setup>
import type { OutputStreamItem } from '#/api';

import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NInput } from 'naive-ui';

import { getActivities } from '#/api';

interface LogLine {
  at: string;
  kind: 'error' | 'output' | 'system';
  text: string;
}

const lines = ref<LogLine[]>([]);
const cursor = ref(0);
const logBody = ref<HTMLElement>();
let pollTimer: ReturnType<typeof setInterval> | undefined;

const logText = computed(() =>
  lines.value
    .map((line) => {
      const prefix = line.kind === 'error' ? '[error]' : '[log]';
      return `${line.at} ${prefix} ${line.text}`;
    })
    .join('\n'),
);

function scrollBottom() {
  void nextTick(() => {
    const textarea = logBody.value?.querySelector('textarea');
    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
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
    // Keep log stream alive even when polling fails.
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
    <div ref="logBody" class="log-body">
      <NInput
        class="log-textarea"
        placeholder="AuroraBot 运行日志"
        readonly
        type="textarea"
        :value="logText"
      />
    </div>
  </Page>
</template>

<style scoped>
.log-body {
  height: 100%;
  min-height: 420px;
}

.log-textarea {
  height: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
}
</style>
