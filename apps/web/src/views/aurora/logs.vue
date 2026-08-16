<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { JsonRecord, OutputStreamItem } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NSpace,
  NSwitch,
  NTag,
} from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import {
  clearConsole,
  getActivities,
  getConsoleLogStatus,
  setConsoleLog,
} from '#/api';
import { $t } from '#/locales';

const activities = ref<OutputStreamItem[]>([]);
const cursor = ref(0);
const consoleStatus = ref<JsonRecord>({});
const consoleEnabled = ref(false);
const loading = ref(false);
const error = ref('');

const columns: DataTableColumns<OutputStreamItem> = [
  { key: 'cursor', title: 'Cursor', width: 90 },
  { key: 'kind', title: 'Kind', width: 100 },
  { key: 'session_id', title: 'Session', ellipsis: { tooltip: true } },
  { key: 'task_id', title: 'Task', ellipsis: { tooltip: true } },
  { key: 'text', title: $t('page.aurora.panel.output') },
  { key: 'at', title: $t('page.aurora.panel.createdAt') },
];

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
  dialog.warning({
    content: $t('page.aurora.panel.logs.clearHelp'),
    title: $t('page.aurora.panel.logs.clear'),
    async onPositiveClick() {
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
      <NSpace align="center">
        <NTag type="warning">console_only</NTag>
        <span>Terminal log</span>
        <NSwitch :value="consoleEnabled" @update:value="toggleConsole" />
        <NButton type="error" @click="confirmClear">
          {{ $t('page.aurora.panel.logs.clear') }}
        </NButton>
      </NSpace>
    </template>
    <NAlert v-if="error" class="mb-4" :title="error" type="error" />
    <NAlert
      class="mb-4"
      :title="$t('page.aurora.panel.logs.consoleScope')"
      type="info"
    />
    <NCard class="mb-4" title="Console status">
      <NDescriptions :column="2" bordered size="small">
        <NDescriptionsItem
          v-for="(item, key) in consoleStatus"
          :key="key"
          :label="key"
        >
          {{ String(item) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>
    <NCard title="Output activities">
      <NDataTable
        :columns="columns"
        :data="activities"
        :loading="loading"
        :pagination="false"
        size="small"
      />
      <div class="mt-4 flex justify-end gap-2">
        <NButton @click="load(true)">
          {{ $t('page.aurora.panel.refresh') }}
        </NButton>
        <NButton type="primary" :loading="loading" @click="load(false)">
          {{ $t('page.aurora.panel.loadMore') }}
        </NButton>
      </div>
    </NCard>
  </Page>
</template>
