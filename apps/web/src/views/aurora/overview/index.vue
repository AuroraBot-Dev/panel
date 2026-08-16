<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type {
  AgentTransport,
  AiCost,
  EngineStatus,
  MemoryStatus,
  TaskTransport,
} from '#/api';

import { computed, h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NSkeleton,
  NStatistic,
  NTag,
} from 'naive-ui';

import {
  getAiCost,
  getEngineStatus,
  getMemoryStatus,
  listAgents,
  listTasks,
} from '#/api';
import { $t } from '#/locales';

import OverviewCharts from './overview-charts.vue';

type DataSource = 'agents' | 'cost' | 'memory' | 'status' | 'tasks';

const loading = ref(true);
const initialized = ref(false);
const failedSources = ref<DataSource[]>([]);
const status = ref<EngineStatus>();
const tasks = ref<TaskTransport[]>([]);
const agents = ref<AgentTransport[]>([]);
const cost = ref<AiCost>();
const memory = ref<MemoryStatus>();

const recentTasks = computed(() =>
  [...tasks.value]
    .toSorted((left, right) => right.updated_at.localeCompare(left.updated_at))
    .slice(0, 5),
);
const failedDescription = computed(() =>
  failedSources.value
    .map((source) => $t(`page.aurora.panel.overview.sources.${source}`))
    .join(', '),
);
const taskColumns = computed<DataTableColumns<TaskTransport>>(() => [
  {
    key: 'task_id',
    title: $t('page.aurora.panel.overview.task'),
    ellipsis: { tooltip: true },
  },
  {
    key: 'status',
    title: $t('page.aurora.panel.status'),
    render: (row) =>
      h(NTag, { type: statusColor(row.status) }, { default: () => row.status }),
  },
  {
    key: 'root_summary',
    title: $t('page.aurora.panel.summary'),
    ellipsis: { tooltip: true },
  },
  {
    key: 'updated_at',
    title: $t('page.aurora.panel.updatedAt'),
    render: (row) => formatDate(row.updated_at),
  },
]);

async function load() {
  loading.value = true;
  failedSources.value = [];

  const [statusResult, tasksResult, agentsResult, costResult, memoryResult] =
    await Promise.allSettled([
      getEngineStatus(),
      listTasks({ limit: 64 }),
      listAgents(),
      getAiCost(),
      getMemoryStatus(),
    ]);

  if (statusResult.status === 'fulfilled') status.value = statusResult.value;
  else failedSources.value.push('status');
  if (tasksResult.status === 'fulfilled') tasks.value = tasksResult.value;
  else failedSources.value.push('tasks');
  if (agentsResult.status === 'fulfilled') agents.value = agentsResult.value;
  else failedSources.value.push('agents');
  if (costResult.status === 'fulfilled') cost.value = costResult.value;
  else failedSources.value.push('cost');
  if (memoryResult.status === 'fulfilled') memory.value = memoryResult.value;
  else failedSources.value.push('memory');

  loading.value = false;
  initialized.value = true;
}

function statusColor(
  value: string,
): 'default' | 'error' | 'info' | 'success' | 'warning' {
  if (['ACTIVE', 'READY'].includes(value)) return 'info';
  if (['COMPLETED', 'SILENT'].includes(value)) return 'success';
  if (['ERROR', 'FAILED'].includes(value)) return 'error';
  if (['BUDGET_EXHAUSTED', 'CANCELLED'].includes(value)) return 'warning';
  return 'default';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

onMounted(load);
</script>

<template>
  <Page>
    <template #extra>
      <NButton :loading="loading" @click="load">
        {{ $t('page.aurora.panel.refresh') }}
      </NButton>
    </template>

    <NAlert
      v-if="failedSources.length"
      class="mb-4"
      :title="$t('page.aurora.panel.overview.partialLoadError')"
      type="warning"
    >
      {{ failedDescription }}
    </NAlert>

    <div v-if="loading && !initialized" class="space-y-4">
      <NSkeleton v-for="row in 8" :key="row" text />
    </div>

    <template v-else>
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <NCard :title="$t('page.aurora.panel.overview.systemStatus')">
          <template #header-extra>
            <NTag :type="status ? 'success' : 'default'">
              {{
                status
                  ? $t('page.aurora.dashboard.online')
                  : $t('page.aurora.panel.overview.unavailable')
              }}
            </NTag>
          </template>
          <NDescriptions :column="2" label-placement="top" size="small">
            <NDescriptionsItem
              :label="$t('page.aurora.panel.overview.activeTasks')"
            >
              {{ status?.active_tasks ?? '--' }}
            </NDescriptionsItem>
            <NDescriptionsItem
              :label="$t('page.aurora.panel.overview.activeAgents')"
            >
              {{ status?.active_agents ?? '--' }}
            </NDescriptionsItem>
            <NDescriptionsItem
              :label="$t('page.aurora.panel.overview.pendingActivities')"
            >
              {{ status?.pending_activities ?? '--' }}
            </NDescriptionsItem>
            <NDescriptionsItem
              :label="$t('page.aurora.panel.overview.pendingMessages')"
            >
              {{ status?.pending_messages ?? '--' }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <NCard :title="$t('page.aurora.panel.overview.cost')">
          <NStatistic :precision="6" :value="cost?.total_cost ?? 0">
            <template #prefix>$</template>
          </NStatistic>
          <div class="mt-4 text-sm text-muted-foreground">
            {{ Object.keys(cost?.by_model ?? {}).length }} models ·
            {{ Object.keys(cost?.by_role ?? {}).length }} roles
          </div>
        </NCard>

        <NCard :title="$t('page.aurora.features.memory.title')">
          <NDescriptions :column="2" label-placement="top" size="small">
            <NDescriptionsItem
              :label="$t('page.aurora.panel.overview.memoryFacts')"
            >
              {{ memory?.facts ?? '--' }}
            </NDescriptionsItem>
            <NDescriptionsItem
              :label="$t('page.aurora.panel.overview.memoryMessages')"
            >
              {{ memory?.window_messages ?? '--' }}
            </NDescriptionsItem>
            <NDescriptionsItem label="Summaries">
              {{ memory?.summaries ?? '--' }}
            </NDescriptionsItem>
            <NDescriptionsItem label="Scopes">
              {{ memory?.scopes.length ?? '--' }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </section>

      <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <NCard :title="$t('page.aurora.panel.overview.taskDistribution')">
          <OverviewCharts kind="tasks" :cost="cost" :tasks="tasks" />
        </NCard>
        <NCard :title="$t('page.aurora.panel.overview.costDistribution')">
          <OverviewCharts kind="cost" :cost="cost" :tasks="tasks" />
        </NCard>
      </section>

      <NCard class="mt-4" :title="$t('page.aurora.panel.overview.recentTasks')">
        <NDataTable
          v-if="recentTasks.length"
          :columns="taskColumns"
          :data="recentTasks"
          :pagination="false"
          size="small"
        />
        <NEmpty
          v-else
          :description="$t('page.aurora.panel.overview.noTasks')"
        />
      </NCard>

      <NCard class="mt-4" :title="$t('page.aurora.panel.overview.totalAgents')">
        <NStatistic :value="agents.length" />
      </NCard>
    </template>
  </Page>
</template>
