<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { MemoryHistory, MemorySearchResult, MemoryStatus } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NInput,
  NInputNumber,
  NStatistic,
  NTabPane,
  NTabs,
} from 'naive-ui';

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

const windowColumns: DataTableColumns<MemoryHistory['window'][number]> = [
  { key: 'scope', title: 'Scope' },
  { key: 'role', title: 'Role' },
  { key: 'content', title: 'Content' },
  { key: 'at', title: 'At' },
];

const summaryColumns: DataTableColumns<MemoryHistory['summaries'][number]> = [
  { key: 'scope', title: 'Scope' },
  { key: 'summary', title: 'Summary' },
  { key: 'updated_at', title: 'Updated' },
];

const factColumns: DataTableColumns<MemoryHistory['facts'][number]> = [
  { key: 'scope', title: 'Scope' },
  { key: 'content', title: 'Content' },
  { key: 'source_task_id', title: 'Task' },
  { key: 'created_at', title: 'Created' },
];

const searchColumns: DataTableColumns<MemorySearchResult> = [
  { key: 'kind', title: 'Kind' },
  { key: 'scope', title: 'Scope' },
  { key: 'content', title: 'Content' },
  { key: 'hits', title: 'Hits' },
];

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
    <NAlert v-if="error" class="mb-4" :title="error" type="error" />
    <section class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      <NCard>
        <NStatistic
          label="Window messages"
          :value="status?.window_messages ?? 0"
        />
      </NCard>
      <NCard>
        <NStatistic label="Summaries" :value="status?.summaries ?? 0" />
      </NCard>
      <NCard><NStatistic label="Facts" :value="status?.facts ?? 0" /></NCard>
      <NCard>
        <NStatistic label="Scopes" :value="status?.scopes.length ?? 0" />
      </NCard>
    </section>
    <NCard>
      <div class="mb-4 flex flex-wrap gap-2">
        <NInput
          v-model:value="scope"
          clearable
          class="w-64"
          placeholder="Scope"
        />
        <NInputNumber v-model:value="limit" :max="500" :min="1" />
        <NButton :loading="loading" @click="load">
          {{ $t('page.aurora.panel.apply') }}
        </NButton>
        <div class="min-w-80 flex-1">
          <div class="flex gap-2">
            <NInput
              v-model:value="query"
              class="flex-1"
              placeholder="Search memory"
              @keydown.enter="search"
            />
            <NButton type="primary" :loading="loading" @click="search">
              {{ $t('page.aurora.panel.search') }}
            </NButton>
          </div>
        </div>
      </div>
      <NTabs>
        <NTabPane name="window" tab="Window">
          <NDataTable
            :columns="windowColumns"
            :data="history?.window ?? []"
            size="small"
          />
        </NTabPane>
        <NTabPane name="summaries" tab="Summaries">
          <NDataTable
            :columns="summaryColumns"
            :data="history?.summaries ?? []"
            size="small"
          />
        </NTabPane>
        <NTabPane name="facts" tab="Facts">
          <NDataTable
            :columns="factColumns"
            :data="history?.facts ?? []"
            size="small"
          />
        </NTabPane>
        <NTabPane name="search" :tab="$t('page.aurora.panel.search')">
          <NDataTable :columns="searchColumns" :data="results" size="small" />
        </NTabPane>
      </NTabs>
    </NCard>
  </Page>
</template>
