<script lang="ts" setup>
import type { SessionExport } from '#/types/aurora';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, Card, Input, Space, Table, Tabs } from 'ant-design-vue';

import { exportSession, getMessages } from '#/api';
import { $t } from '#/locales';
import { PANEL_OWNER } from '#/types/aurora';

const sessionId = ref(PANEL_OWNER);
const history = ref<SessionExport>();
const exported = ref<SessionExport>();
const loading = ref(false);
const error = ref('');

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
    <Card>
      <Space.Compact class="mb-4 w-full max-w-2xl">
        <Input
          v-model:value="sessionId"
          placeholder="Session ID"
          @press-enter="load"
        />
        <Button type="primary" :loading="loading" @click="load">
          {{ $t('page.aurora.panel.apply') }}
        </Button>
      </Space.Compact>
      <Alert
        v-if="error"
        class="mb-4"
        :message="error"
        show-icon
        type="error"
      />

      <Tabs>
        <Tabs.TabPane
          key="events"
          :tab="$t('page.aurora.panel.observation.events')"
        >
          <Table
            :columns="[
              { title: 'Type', dataIndex: 'type', key: 'type' },
              {
                title: 'Task',
                dataIndex: 'task_id',
                key: 'task_id',
                ellipsis: true,
              },
              {
                title: $t('page.aurora.panel.summary'),
                dataIndex: 'summary',
                key: 'summary',
                ellipsis: true,
              },
              {
                title: $t('page.aurora.panel.createdAt'),
                dataIndex: 'created_at',
                key: 'created_at',
              },
            ]"
            :data-source="history?.events ?? []"
            row-key="event_id"
            size="small"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="outputs" tab="Model outputs">
          <Table
            :columns="[
              { title: 'Kind', dataIndex: 'kind', key: 'kind' },
              {
                title: 'Task',
                dataIndex: 'task_id',
                key: 'task_id',
                ellipsis: true,
              },
              {
                title: $t('page.aurora.panel.output'),
                dataIndex: 'text',
                key: 'text',
                ellipsis: true,
              },
              {
                title: $t('page.aurora.panel.createdAt'),
                dataIndex: 'at',
                key: 'at',
              },
            ]"
            :data-source="exported?.outputs ?? history?.outputs ?? []"
            row-key="activity_id"
            size="small"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="raw" tab="Raw export">
          <pre class="json-preview">{{
            JSON.stringify(exported ?? history, null, 2)
          }}</pre>
        </Tabs.TabPane>
      </Tabs>
    </Card>
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
