<script lang="ts" setup>
import type {
  AttachmentRecord,
  OutputStreamItem,
  WebSocketOutputEvent,
} from '#/api';

import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { NAlert, NAvatar, NButton, NInput, NTag } from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  downloadAttachment,
  getActivities,
  getMessages,
  PANEL_OWNER,
  panelWebSocketUrl,
  sendMessage,
  uploadAttachment,
} from '#/api';
import { $t } from '#/locales';

interface ChatLine {
  at: string;
  id: string;
  kind: 'assistant' | 'error' | 'user';
  text: string;
}

const accessStore = useAccessStore();
const lines = ref<ChatLine[]>([]);
const attachments = ref<AttachmentRecord[]>([]);
const text = ref('');
const sending = ref(false);
const uploading = ref(false);
const connected = ref(false);
const error = ref('');
const chatBody = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();
const seenActivities = new Set<string>();
let cursor = 0;
let socket: undefined | WebSocket;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let pollTimer: ReturnType<typeof setInterval> | undefined;
let disposed = false;

function scrollBottom() {
  void nextTick(() => {
    if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight;
  });
}

function appendOutput(item: OutputStreamItem) {
  cursor = Math.max(cursor, item.cursor);
  if (item.session_id !== PANEL_OWNER || seenActivities.has(item.activity_id))
    return;
  seenActivities.add(item.activity_id);
  lines.value.push({
    at: item.at,
    id: item.activity_id,
    kind: item.kind === 'error' ? 'error' : 'assistant',
    text: item.text,
  });
  scrollBottom();
}

async function loadHistory() {
  error.value = '';
  try {
    const history = await getMessages(PANEL_OWNER);
    const userLines: ChatLine[] = history.events
      .filter((item) => item.type === 'message.received')
      .map((item) => ({
        at: item.created_at,
        id: item.event_id,
        kind: 'user',
        text: item.summary,
      }));
    const outputLines: ChatLine[] = history.outputs.map((item) => {
      seenActivities.add(item.activity_id);
      return {
        at: item.at,
        id: item.activity_id,
        kind: item.kind === 'error' ? 'error' : 'assistant',
        text: item.text,
      };
    });
    lines.value = [...userLines, ...outputLines].toSorted((a, b) =>
      a.at.localeCompare(b.at),
    );
    scrollBottom();
  } catch (loadError) {
    error.value = (loadError as Error).message;
  }
}

async function pollActivities() {
  try {
    const page = await getActivities(cursor);
    page.items.forEach(appendOutput);
    cursor = page.next_cursor;
  } catch {
    // Global request handling reports authentication and transport failures.
  }
}

function connect() {
  if (disposed || !accessStore.accessToken) return;
  socket?.close();
  socket = new WebSocket(panelWebSocketUrl(accessStore.accessToken));
  socket.addEventListener('open', () => {
    connected.value = true;
  });
  socket.addEventListener('message', (event) => {
    try {
      const payload = JSON.parse(event.data) as WebSocketOutputEvent;
      if (payload.type === 'output') appendOutput(payload.item);
    } catch {
      // Ignore malformed frames and keep the stream alive.
    }
  });
  socket.addEventListener('close', () => {
    connected.value = false;
    if (!disposed) reconnectTimer = setTimeout(connect, 3000);
  });
}

async function submit() {
  const value = text.value.trim();
  if (!value || sending.value) return;
  const clientId = crypto.randomUUID();
  lines.value.push({
    at: new Date().toISOString(),
    id: clientId,
    kind: 'user',
    text: value,
  });
  text.value = '';
  sending.value = true;
  scrollBottom();
  try {
    await sendMessage({
      attachments: attachments.value.length > 0 ? attachments.value : undefined,
      client_message_id: clientId,
      session_id: PANEL_OWNER,
      text: value,
    });
    attachments.value = [];
  } catch (sendError) {
    lines.value.push({
      at: new Date().toISOString(),
      id: `${clientId}-error`,
      kind: 'error',
      text: (sendError as Error).message,
    });
  } finally {
    sending.value = false;
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

async function selectFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    attachments.value.push(await uploadAttachment(file));
    message.success($t('page.aurora.panel.chat.uploaded'));
  } catch (uploadError) {
    message.error((uploadError as Error).message);
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

async function download(item: AttachmentRecord) {
  const result = await downloadAttachment(item.attachment_id);
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = item.name;
  anchor.click();
  URL.revokeObjectURL(url);
}

onMounted(async () => {
  await loadHistory();
  await pollActivities();
  connect();
  pollTimer = setInterval(() => {
    if (!connected.value) void pollActivities();
  }, 4000);
});

onBeforeUnmount(() => {
  disposed = true;
  socket?.close();
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <Page>
    <NAlert v-if="error" class="mb-4" :title="error" type="error" />
    <div class="chat-card">
      <div ref="chatBody" class="chat-body">
        <div
          v-for="line in lines"
          :key="line.id"
          class="chat-line"
          :class="[`chat-${line.kind}`]"
        >
          <NAvatar
            v-if="line.kind !== 'user'"
            class="chat-avatar"
            :size="32"
            round
          >
            <IconifyIcon icon="lucide:bot" class="size-4" />
          </NAvatar>
          <div class="chat-bubble">
            <small>{{ line.kind }} · {{ line.at }}</small>
            <div class="whitespace-pre-wrap">{{ line.text }}</div>
          </div>
          <NAvatar
            v-if="line.kind === 'user'"
            class="chat-avatar"
            :size="32"
            round
          >
            <IconifyIcon icon="lucide:user" class="size-4" />
          </NAvatar>
        </div>
      </div>

      <div v-if="attachments.length" class="mb-3 flex flex-wrap gap-2">
        <NTag
          v-for="item in attachments"
          :key="item.attachment_id"
          closable
          @close="
            attachments = attachments.filter(
              (value) => value.attachment_id !== item.attachment_id,
            )
          "
        >
          <button type="button" @click="download(item)">
            {{ item.name }} · {{ item.size }} B
          </button>
        </NTag>
      </div>

      <div class="chat-actions">
        <NButton
          circle
          :disabled="uploading"
          type="default"
          @click="triggerFileInput"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" />
          </template>
        </NButton>
        <NInput
          v-model:value="text"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 6 }"
          :placeholder="$t('page.aurora.panel.chat.placeholder')"
          @keydown.ctrl.enter.prevent="submit"
        />
        <NButton circle type="primary" :loading="sending" @click="submit">
          <template #icon>
            <IconifyIcon icon="lucide:arrow-up" class="size-4" />
          </template>
        </NButton>
        <input
          ref="fileInput"
          class="hidden"
          type="file"
          :disabled="uploading"
          @change="selectFile"
        />
      </div>
      <p class="chat-ai-hint">{{ $t('page.aurora.panel.chat.aiHint') }}</p>
    </div>
  </Page>
</template>

<style scoped>
.chat-card {
  display: flex;
  flex-direction: column;
  max-width: 860px;
  height: 100%;
  min-height: 520px;
  margin: 0 auto;
}

.chat-body {
  flex: 1;
  min-height: 360px;
  padding: 24px 8px;
  margin-bottom: 16px;
  overflow-y: auto;
}

.chat-line {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  max-width: 760px;
  margin: 0 auto 16px;
}

.chat-user {
  justify-content: flex-end;
}

.chat-avatar {
  flex: none;
}

.chat-bubble {
  max-width: 85%;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.7;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
}

.chat-user .chat-bubble {
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
  border-color: transparent;
  border-bottom-right-radius: 4px;
}

.chat-assistant .chat-bubble {
  border-bottom-left-radius: 4px;
}

.chat-error .chat-bubble {
  color: hsl(var(--destructive));
  border-color: hsl(var(--destructive) / 30%);
}

.chat-bubble small {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  opacity: 0.65;
}

.chat-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-ai-hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
  text-align: center;
}
</style>
