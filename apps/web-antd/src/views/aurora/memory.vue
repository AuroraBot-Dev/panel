<script lang="ts" setup>
import type {
  MemoryHistory,
  MemorySearchResult,
  MemoryStatus,
} from '#/types/aurora';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Space,
  Statistic,
  Table,
  Tabs,
} from 'ant-design-vue';

import { getMemoryHistory, getMemoryStatus, searchMemory } from '#/api';
import { $t } from '#/locales';

const status = ref<MemoryStatus>();
const history = ref<MemoryHistory>();
const results = ref<MemorySearchResult[]>([]);
const scope = ref('');
const query = ref('');
const limit = ref(32);
const loading = ref(false);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    [status.value, history.value] = await Promise.all([
      getMemoryStatus(),
      getMemoryHistory({
        limit: limit.value,
        ...(scope.value.trim() ? { scope: scope.value.trim() } : {}),
      }),
    ]);
  } catch (loadError) {
    error.value = (loadError as Error).message;
  } finally {
    loading.value = false;
  }
}

async function search() {
  if (!query.value.trim()) return;
  loading.value = true;
  try {
    results.value = await searchMemory({
      limit: limit.value,
      query: query.value.trim(),
      ...(scope.value.trim() ? { scope: scope.value.trim() } : {}),
    });
  } catch (searchError) {
    error.value = (searchError as Error).message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page
    :description="$t('page.aurora.features.memory.description')"
    :title="$t('page.aurora.features.memory.title')"
  >
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <section class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card
        ><Statistic
          title="Window messages"
          :value="status?.window_messages ?? 0"
      /></Card>
      <Card
        ><Statistic title="Summaries" :value="status?.summaries ?? 0"
      /></Card>
      <Card><Statistic title="Facts" :value="status?.facts ?? 0" /></Card>
      <Card
        ><Statistic title="Scopes" :value="status?.scopes.length ?? 0"
      /></Card>
    </section>
    <Card>
      <div class="mb-4 flex flex-wrap gap-2">
        <Input
          v-model:value="scope"
          allow-clear
          class="w-64"
          placeholder="Scope"
        />
        <InputNumber v-model:value="limit" :max="500" :min="1" />
        <Button :loading="loading" @click="load">{{
          $t('page.aurora.panel.apply')
        }}</Button>
        <Space.Compact class="min-w-80 flex-1">
          <Input
            v-model:value="query"
            placeholder="Search memory"
            @press-enter="search"
          />
          <Button type="primary" :loading="loading" @click="search">{{
            $t('page.aurora.panel.search')
          }}</Button>
        </Space.Compact>
      </div>
      <Tabs>
        <Tabs.TabPane key="window" tab="Window">
          <Table
            :columns="[
              { title: 'Scope', dataIndex: 'scope', key: 'scope' },
              { title: 'Role', dataIndex: 'role', key: 'role' },
              { title: 'Content', dataIndex: 'content', key: 'content' },
              { title: 'At', dataIndex: 'at', key: 'at' },
            ]"
            :data-source="history?.window ?? []"
            size="small"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="summaries" tab="Summaries">
          <Table
            :columns="[
              { title: 'Scope', dataIndex: 'scope', key: 'scope' },
              { title: 'Summary', dataIndex: 'summary', key: 'summary' },
              { title: 'Updated', dataIndex: 'updated_at', key: 'updated_at' },
            ]"
            :data-source="history?.summaries ?? []"
            size="small"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="facts" tab="Facts">
          <Table
            :columns="[
              { title: 'Scope', dataIndex: 'scope', key: 'scope' },
              { title: 'Content', dataIndex: 'content', key: 'content' },
              {
                title: 'Task',
                dataIndex: 'source_task_id',
                key: 'source_task_id',
              },
              { title: 'Created', dataIndex: 'created_at', key: 'created_at' },
            ]"
            :data-source="history?.facts ?? []"
            size="small"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="search" :tab="$t('page.aurora.panel.search')">
          <Table
            :columns="[
              { title: 'Kind', dataIndex: 'kind', key: 'kind' },
              { title: 'Scope', dataIndex: 'scope', key: 'scope' },
              { title: 'Content', dataIndex: 'content', key: 'content' },
              { title: 'Hits', dataIndex: 'hits', key: 'hits' },
            ]"
            :data-source="results"
            size="small"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
