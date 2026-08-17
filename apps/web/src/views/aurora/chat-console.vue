<script lang="ts" setup>
import type { CSSProperties } from 'vue';

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
  isOfflinePanelToken,
  PANEL_OWNER,
  panelWebSocketUrl,
  sendMessage,
  uploadAttachment,
} from '#/api';
import { $t } from '#/locales';
import { useChatAvatarStore } from '#/store';

interface ChatLine {
  at: string;
  id: string;
  kind: 'assistant' | 'error' | 'user';
  text: string;
}

const accessStore = useAccessStore();
const chatAvatar = useChatAvatarStore();
const lines = ref<ChatLine[]>([]);
const attachments = ref<AttachmentRecord[]>([]);
const text = ref('');
const sending = ref(false);
const uploading = ref(false);
const connected = ref(false);
const error = ref('');
const chatBody = ref<HTMLElement>();
const chatInputStyle = ref<CSSProperties>({});
const fileInput = ref<HTMLInputElement>();
const seenActivities = new Set<string>();
let cursor = 0;
let socket: undefined | WebSocket;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let pollTimer: ReturnType<typeof setInterval> | undefined;
let layoutResizeObserver: ResizeObserver | undefined;
let layoutScrollElement: HTMLElement | undefined;
let disposed = false;

function avatarIcon(line: ChatLine) {
  return line.kind === 'user' ? chatAvatar.userIcon : chatAvatar.botIcon;
}

function findScrollContainer(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return parent;
    parent = parent.parentElement;
  }
}

function syncInputBounds() {
  const rect = chatBody.value?.getBoundingClientRect();
  if (!rect) return;
  chatInputStyle.value = {
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
}

function scrollBottom() {
  void nextTick(() => {
    requestAnimationFrame(() => {
      if (layoutScrollElement) {
        layoutScrollElement.scrollTop = layoutScrollElement.scrollHeight;
      }
    });
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
  if (
    disposed ||
    !accessStore.accessToken ||
    isOfflinePanelToken(accessStore.accessToken)
  ) {
    return;
  }
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
  if (chatBody.value) {
    layoutScrollElement = findScrollContainer(chatBody.value);
    syncInputBounds();
    layoutResizeObserver = new ResizeObserver(syncInputBounds);
    layoutResizeObserver.observe(chatBody.value);
    if (layoutScrollElement) layoutResizeObserver.observe(layoutScrollElement);
    window.addEventListener('resize', syncInputBounds);
  }
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
  layoutResizeObserver?.disconnect();
  window.removeEventListener('resize', syncInputBounds);
});
</script>

<template>
  <Page>
    <NAlert v-if="error" class="mb-4" :title="error" type="error" />
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
          <IconifyIcon :icon="avatarIcon(line)" class="size-4" />
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
          <IconifyIcon :icon="avatarIcon(line)" class="size-4" />
        </NAvatar>
      </div>
    </div>

    <div class="chat-input-float" :style="chatInputStyle">
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
      <div class="chat-input-box">
        <NInput
          v-model:value="text"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 8 }"
          :bordered="false"
          :placeholder="$t('page.aurora.panel.chat.placeholder')"
          @keydown.ctrl.enter.prevent="submit"
        />
        <div class="chat-input-toolbar">
          <NButton
            circle
            size="medium"
            :disabled="uploading"
            type="default"
            @click="triggerFileInput"
          >
            <template #icon>
              <IconifyIcon icon="lucide:plus" class="size-5" />
            </template>
          </NButton>
          <p class="chat-ai-hint">
            {{ $t('page.aurora.panel.chat.aiHint') }}
          </p>
          <NButton
            circle
            size="medium"
            type="primary"
            :loading="sending"
            @click="submit"
          >
            <template #icon>
              <IconifyIcon icon="lucide:arrow-up" class="size-5" />
            </template>
          </NButton>
        </div>
        <input
          ref="fileInput"
          class="hidden"
          type="file"
          :disabled="uploading"
          @change="selectFile"
        />
      </div>
    </div>
  </Page>
</template>

<style scoped>
.chat-body {
  min-height: calc(var(--vben-content-height) - 32px);
  padding: 8px 8px 180px;
}

.chat-line {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  max-width: 100%;
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

.chat-input-float {
  position: fixed;
  bottom: 0;
  z-index: 10;
  padding: 12px 16px 8px;
}

.chat-input-box {
  width: 100%;
  max-width: 760px;
  padding: 8px;
  margin: 0 auto;
  background: color-mix(in srgb, hsl(var(--card)) 80%, transparent);
  border: 1px solid hsl(var(--border));
  border-radius: 24px;
  box-shadow: 0 4px 24px rgb(0 0 0 / 8%);
  backdrop-filter: blur(8px);
  transition: border-color 0.2s;
}

.chat-input-box:focus-within {
  border-color: hsl(var(--primary));
}

.chat-input-box :deep(.n-input) {
  background: transparent;
}

.chat-input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
}

.chat-ai-hint {
  flex: 1;
  margin: 0 8px;
  font-size: 12px;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
  text-align: center;
}
</style>
