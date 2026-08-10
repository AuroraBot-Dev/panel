<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { SessionExport } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NInput,
  NTabPane,
  NTabs,
} from 'naive-ui';

import { exportSession, getMessages, PANEL_OWNER } from '#/api';
import { $t } from '#/locales';

interface EventRow {
  created_at: string;
  event_id: string;
  summary: string;
  task_id: string;
  type: string;
}

interface OutputRow {
  activity_id: string;
  at: string;
  kind: string;
  task_id: string;
  text: string;
}

const sessionId = ref(PANEL_OWNER);
const history = ref<SessionExport>();
const exported = ref<SessionExport>();
const loading = ref(false);
const error = ref('');

const eventColumns: DataTableColumns<EventRow> = [
  { key: 'type', title: 'Type' },
  { key: 'task_id', title: 'Task', ellipsis: { tooltip: true } },
  {
    key: 'summary',
    title: $t('page.aurora.panel.summary'),
    ellipsis: { tooltip: true },
  },
  { key: 'created_at', title: $t('page.aurora.panel.createdAt') },
];

const outputColumns: DataTableColumns<OutputRow> = [
  { key: 'kind', title: 'Kind' },
  { key: 'task_id', title: 'Task', ellipsis: { tooltip: true } },
  {
    key: 'text',
    title: $t('page.aurora.panel.output'),
    ellipsis: { tooltip: true },
  },
  { key: 'at', title: $t('page.aurora.panel.createdAt') },
];

async function load() {
  if (!sessionId.value.trim()) return;
  loading.value = true;
  error.value = '';
  try {
    history.value = await getMessages(sessionId.value.trim());
    try {
      exported.value = await exportSession(sessionId.value.trim());
    } catch {
      exported.value = undefined;
    }
  } catch (loadError) {
    error.value = (loadError as Error).message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page
    :description="$t('page.aurora.panel.conversations.description')"
    :title="$t('page.aurora.features.conversations.title')"
  >
    <NCard>
      <div class="mb-4 flex w-full max-w-2xl gap-2">
        <NInput
          v-model:value="sessionId"
          placeholder="Session ID"
          @keydown.enter="load"
        />
        <NButton type="primary" :loading="loading" @click="load">
          {{ $t('page.aurora.panel.apply') }}
        </NButton>
      </div>
      <NAlert v-if="error" class="mb-4" :title="error" type="error" />

      <NTabs>
        <NTabPane
          name="events"
          :tab="$t('page.aurora.panel.observation.events')"
        >
          <NDataTable
            :columns="eventColumns"
            :data="(history?.events ?? []) as EventRow[]"
            size="small"
          />
        </NTabPane>
        <NTabPane name="outputs" tab="Model outputs">
          <NDataTable
            :columns="outputColumns"
            :data="(exported?.outputs ?? history?.outputs ?? []) as OutputRow[]"
            size="small"
          />
        </NTabPane>
        <NTabPane name="raw" tab="Raw export">
          <pre class="json-preview">{{
            JSON.stringify(exported ?? history, null, 2)
          }}</pre>
        </NTabPane>
      </NTabs>
    </NCard>
  </Page>
</template>

<style scoped>
.json-preview {
  max-height: 65vh;
  padding: 12px;
  overflow: auto;
  font-size: 12px;
  background: hsl(var(--muted));
  border-radius: 6px;
}
</style>
