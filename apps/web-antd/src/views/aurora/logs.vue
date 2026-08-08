<script lang="ts" setup>
import type { JsonRecord, OutputStreamItem } from '#/types/aurora';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  clearConsole,
  getActivities,
  getConsoleLogStatus,
  setConsoleLog,
} from '#/api';
import JsonView from '#/components/aurora/json-view.vue';
import { $t } from '#/locales';

const activities = ref<OutputStreamItem[]>([]);
const cursor = ref(0);
const consoleStatus = ref<JsonRecord>({});
const consoleEnabled = ref(false);
const loading = ref(false);
const error = ref('');

async function load(reset = false) {
  loading.value = true;
  error.value = '';
  try {
    if (reset) {
      cursor.value = 0;
      activities.value = [];
    }
    const [page, status] = await Promise.all([
      getActivities(cursor.value, 64),
      getConsoleLogStatus(),
    ]);
    const known = new Set(activities.value.map((item) => item.activity_id));
    activities.value.push(
      ...page.items.filter((item) => !known.has(item.activity_id)),
    );
    cursor.value = page.next_cursor;
    consoleStatus.value = status;
    consoleEnabled.value = Boolean(status.enabled);
  } catch (loadError) {
    error.value = (loadError as Error).message;
  } finally {
    loading.value = false;
  }
}

async function toggleConsole(checked: boolean | number | string) {
  const enabled = checked === true;
  try {
    await setConsoleLog(enabled);
    consoleEnabled.value = enabled;
    await load(false);
  } catch {
    consoleEnabled.value = !enabled;
  }
}

function confirmClear() {
  Modal.confirm({
    content: $t('page.aurora.panel.logs.clearHelp'),
    title: $t('page.aurora.panel.logs.clear'),
    async onOk() {
      await clearConsole();
      message.success($t('page.aurora.panel.logs.clearResult'));
    },
  });
}

onMounted(() => load(true));
</script>

<template>
  <Page
    :description="$t('page.aurora.features.logs.description')"
    :title="$t('page.aurora.features.logs.title')"
  >
    <template #extra>
      <Space>
        <Tag color="orange">console_only</Tag>
        <span>Terminal log</span>
        <Switch :checked="consoleEnabled" @change="toggleConsole" />
        <Button danger @click="confirmClear">{{
          $t('page.aurora.panel.logs.clear')
        }}</Button>
      </Space>
    </template>
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Alert
      class="mb-4"
      :message="$t('page.aurora.panel.logs.consoleScope')"
      show-icon
      type="info"
    />
    <Card class="mb-4" title="Console status"
      ><JsonView :value="consoleStatus"
    /></Card>
    <Card title="Output activities">
      <Table
        :columns="[
          { title: 'Cursor', dataIndex: 'cursor', key: 'cursor', width: 90 },
          { title: 'Kind', dataIndex: 'kind', key: 'kind', width: 100 },
          {
            title: 'Session',
            dataIndex: 'session_id',
            key: 'session_id',
            ellipsis: true,
          },
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
          },
          {
            title: $t('page.aurora.panel.createdAt'),
            dataIndex: 'at',
            key: 'at',
          },
        ]"
        :data-source="activities"
        :loading="loading"
        :pagination="false"
        row-key="activity_id"
        size="small"
      />
      <div class="mt-4 flex justify-end gap-2">
        <Button @click="load(true)">{{
          $t('page.aurora.panel.refresh')
        }}</Button>
        <Button type="primary" :loading="loading" @click="load(false)">{{
          $t('page.aurora.panel.loadMore')
        }}</Button>
      </div>
    </Card>
  </Page>
</template>
