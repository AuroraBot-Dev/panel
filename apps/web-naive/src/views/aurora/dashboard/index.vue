<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { DashboardRange } from './dashboard-data';

import type {
  AgentTransport,
  AiCost,
  EngineStatus,
  MemoryStatus,
  TaskTransport,
} from '#/types/aurora';

import { computed, h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NProgress,
  NRadioButton,
  NRadioGroup,
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

import { dashboardSamples } from './dashboard-data';
import OverviewCharts from './overview-charts.vue';

type DataSource = 'agents' | 'cost' | 'memory' | 'status' | 'tasks';

const loading = ref(true);
const initialized = ref(false);
const failedSources = ref<DataSource[]>([]);
const range = ref<DashboardRange>('24h');
const status = ref<EngineStatus>();
const tasks = ref<TaskTransport[]>([]);
const agents = ref<AgentTransport[]>([]);
const cost = ref<AiCost>();
const memory = ref<MemoryStatus>();

const sample = computed(() => dashboardSamples[range.value]);
const totalTokens = computed(
  () => sample.value.inputTokens + sample.value.outputTokens,
);
const recentTasks = computed(() =>
  [...tasks.value]
    .toSorted((left, right) => right.updated_at.localeCompare(left.updated_at))
    .slice(0, 5),
);
const totalStorage = computed(() =>
  sample.value.storage.reduce((total, item) => total + item.sizeBytes, 0),
);
const rangeOptions = computed(() => [
  { label: $t('page.aurora.panel.overview.range24h'), value: '24h' },
  { label: $t('page.aurora.panel.overview.range7d'), value: '7d' },
  { label: $t('page.aurora.panel.overview.range30d'), value: '30d' },
]);
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

function changeRange(value: number | string) {
  range.value = value as DashboardRange;
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

function formatBytes(value = 0) {
  if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(1)} GB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

onMounted(load);
</script>

<template>
  <Page
    :description="$t('page.aurora.panel.overview.description')"
    :title="$t('page.aurora.dashboard.title')"
  >
    <template #extra>
      <div
        class="dashboard-actions flex flex-wrap items-center justify-end gap-2"
      >
        <NRadioGroup :value="range" size="small" @update:value="changeRange">
          <NRadioButton
            v-for="option in rangeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </NRadioButton>
        </NRadioGroup>
        <NButton :loading="loading" @click="load">
          {{ $t('page.aurora.panel.refresh') }}
        </NButton>
      </div>
    </template>

    <NAlert
      v-if="failedSources.length"
      class="mb-4"
      :title="$t('page.aurora.panel.overview.partialLoadError')"
      type="warning"
    >
      {{ failedDescription }}
      <template #header>
        {{ $t('page.aurora.panel.overview.partialLoadError') }}
        <NButton size="small" class="ml-2" @click="load">
          {{ $t('page.aurora.dashboard.retry') }}
        </NButton>
      </template>
    </NAlert>

    <div v-if="loading && !initialized" class="space-y-4">
      <NSkeleton v-for="row in 10" :key="row" text />
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
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">
            <NStatistic
              :label="$t('page.aurora.panel.overview.activeTasks')"
              :value="status?.active_tasks ?? '--'"
            />
            <NStatistic
              :label="$t('page.aurora.panel.overview.activeAgents')"
              :value="status?.active_agents ?? '--'"
            />
            <NStatistic
              :label="$t('page.aurora.panel.overview.memoryFacts')"
              :value="memory?.facts ?? '--'"
            />
            <NStatistic
              :label="$t('page.aurora.panel.overview.memoryMessages')"
              :value="memory?.window_messages ?? '--'"
            />
          </div>
        </NCard>

        <NCard :title="$t('page.aurora.panel.overview.queueOverview')">
          <template #header-extra>
            <NTag :type="status?.model_dispatch_active ? 'info' : 'default'">
              {{
                status?.model_dispatch_active
                  ? $t('page.aurora.panel.overview.dispatching')
                  : $t('page.aurora.panel.overview.dispatchStopped')
              }}
            </NTag>
          </template>
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">
            <NStatistic
              :label="$t('page.aurora.panel.overview.pendingActivities')"
              :value="status?.pending_activities ?? '--'"
            />
            <NStatistic
              :label="$t('page.aurora.panel.overview.pendingMessages')"
              :value="status?.pending_messages ?? '--'"
            />
            <NStatistic
              :label="$t('page.aurora.panel.overview.pendingModel')"
              :value="status?.pending_model_activities ?? '--'"
            />
            <NStatistic
              :label="$t('page.aurora.panel.overview.pendingTool')"
              :value="status?.pending_tool_activities ?? '--'"
            />
          </div>
        </NCard>

        <NCard :title="$t('page.aurora.dashboard.storage')">
          <template #header-extra>
            <NTag type="warning">
              {{ $t('page.aurora.panel.overview.sampleData') }}
            </NTag>
          </template>
          <div class="mb-4 flex items-end justify-between">
            <NStatistic
              :label="$t('page.aurora.panel.overview.totalStorage')"
              :value="formatBytes(totalStorage)"
            />
          </div>
          <div
            v-for="item in sample.storage"
            :key="item.key"
            class="mb-3 last:mb-0"
          >
            <div class="mb-1 flex items-center justify-between text-sm">
              <span>{{
                $t(`page.aurora.panel.overview.storage.${item.key}`)
              }}</span>
              <span class="text-muted-foreground">{{
                formatBytes(item.sizeBytes)
              }}</span>
            </div>
            <NProgress
              :percentage="Math.round((item.sizeBytes / totalStorage) * 100)"
              :show-indicator="false"
              :height="8"
            />
          </div>
        </NCard>
      </section>

      <section
        class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
      >
        <NCard size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.requests')
            }}</span>
            <NTag type="warning">
              {{ $t('page.aurora.panel.overview.sampleData') }}
            </NTag>
          </div>
          <NStatistic :value="sample.requests" />
        </NCard>
        <NCard size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.cost')
            }}</span>
            <NTag :type="cost ? 'success' : 'default'">
              {{
                cost
                  ? $t('page.aurora.panel.overview.realData')
                  : $t('page.aurora.panel.overview.unavailable')
              }}
            </NTag>
          </div>
          <NStatistic :precision="6" :value="cost?.total_cost ?? 0">
            <template #prefix>$</template>
          </NStatistic>
        </NCard>
        <NCard size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.tokens')
            }}</span>
            <NTag type="warning">
              {{ $t('page.aurora.panel.overview.sampleData') }}
            </NTag>
          </div>
          <NStatistic :value="totalTokens" />
        </NCard>
        <NCard size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.latency')
            }}</span>
            <NTag type="warning">
              {{ $t('page.aurora.panel.overview.sampleData') }}
            </NTag>
          </div>
          <NStatistic :value="sample.averageLatencyMs">
            <template #suffix>ms</template>
          </NStatistic>
        </NCard>
        <NCard size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.messages')
            }}</span>
            <NTag type="warning">
              {{ $t('page.aurora.panel.overview.sampleData') }}
            </NTag>
          </div>
          <NStatistic :value="sample.messages" />
        </NCard>
        <NCard size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.cache')
            }}</span>
            <NTag type="warning">
              {{ $t('page.aurora.panel.overview.sampleData') }}
            </NTag>
          </div>
          <NStatistic :precision="1" :value="sample.cacheHitRate">
            <template #suffix>%</template>
          </NStatistic>
        </NCard>
      </section>

      <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <NCard :title="$t('page.aurora.panel.overview.activityTrend')">
          <template #header-extra>
            <NTag type="warning">
              {{ $t('page.aurora.panel.overview.sampleData') }}
            </NTag>
          </template>
          <OverviewCharts
            :cost="cost"
            kind="activity"
            :sample="sample"
            :tasks="tasks"
          />
        </NCard>
        <NCard :title="$t('page.aurora.panel.overview.tokenTrend')">
          <template #header-extra>
            <NTag type="warning">
              {{ $t('page.aurora.panel.overview.sampleData') }}
            </NTag>
          </template>
          <OverviewCharts
            :cost="cost"
            kind="tokens"
            :sample="sample"
            :tasks="tasks"
          />
        </NCard>
        <NCard :title="$t('page.aurora.panel.overview.taskDistribution')">
          <template #header-extra>
            <NTag
              :type="failedSources.includes('tasks') ? 'default' : 'success'"
            >
              {{
                failedSources.includes('tasks')
                  ? $t('page.aurora.panel.overview.unavailable')
                  : $t('page.aurora.panel.overview.realData')
              }}
            </NTag>
          </template>
          <OverviewCharts
            :cost="cost"
            kind="tasks"
            :sample="sample"
            :tasks="tasks"
          />
        </NCard>
        <NCard :title="$t('page.aurora.panel.overview.costDistribution')">
          <template #header-extra>
            <NTag :type="cost ? 'success' : 'default'">
              {{
                cost
                  ? $t('page.aurora.panel.overview.realData')
                  : $t('page.aurora.panel.overview.unavailable')
              }}
            </NTag>
          </template>
          <OverviewCharts
            :cost="cost"
            kind="cost"
            :sample="sample"
            :tasks="tasks"
          />
        </NCard>
      </section>

      <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <NCard
          class="overflow-hidden xl:col-span-2"
          :title="$t('page.aurora.panel.overview.recentTasks')"
        >
          <div class="overflow-x-auto">
            <NDataTable
              :columns="taskColumns"
              :data="recentTasks"
              :pagination="false"
              :scroll-x="720"
              size="small"
            >
              <template #empty>
                <NEmpty :description="$t('page.aurora.panel.empty')" />
              </template>
            </NDataTable>
          </div>
        </NCard>

        <NCard :title="$t('page.aurora.panel.overview.runtime')">
          <div class="space-y-4">
            <div class="flex justify-between gap-4">
              <span>{{ $t('page.aurora.panel.overview.modelDispatch') }}</span>
              <NTag
                :type="status?.model_dispatch_active ? 'success' : 'default'"
              >
                {{ status?.model_dispatch_active ? 'ON' : 'OFF' }}
              </NTag>
            </div>
            <div class="flex justify-between gap-4">
              <span>{{
                $t('page.aurora.panel.overview.modelActivities')
              }}</span>
              <strong>{{ status?.active_model_activities ?? '--' }}</strong>
            </div>
            <div class="flex justify-between gap-4">
              <span>{{ $t('page.aurora.panel.overview.inboxEvents') }}</span>
              <strong>{{ status?.inbox_events ?? '--' }}</strong>
            </div>
            <div class="flex justify-between gap-4">
              <span>{{
                $t('page.aurora.panel.overview.dueInboxSessions')
              }}</span>
              <strong>{{ status?.due_inbox_sessions ?? '--' }}</strong>
            </div>
            <div class="flex justify-between gap-4">
              <span>{{ $t('page.aurora.panel.overview.totalAgents') }}</span>
              <strong>{{
                failedSources.includes('agents') ? '--' : agents.length
              }}</strong>
            </div>
          </div>
        </NCard>
      </section>
    </template>
  </Page>
</template>

<style scoped>
@media (max-width: 720px) {
  .dashboard-actions {
    justify-content: flex-start;
  }

  .dashboard-actions > * {
    max-width: 100%;
  }
}
</style>
