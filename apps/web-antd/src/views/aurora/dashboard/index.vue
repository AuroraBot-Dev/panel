<script lang="ts" setup>
import type {
  AgentTransport,
  AiCost,
  EngineStatus,
  MemoryStatus,
  TaskTransport,
} from '#/types/aurora';

import type { DashboardRange } from './dashboard-data';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Empty,
  Progress,
  Segmented,
  Skeleton,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';

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
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
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
const taskColumns = computed(() => [
  {
    dataIndex: 'task_id',
    ellipsis: true,
    key: 'task_id',
    title: $t('page.aurora.panel.overview.task'),
  },
  {
    dataIndex: 'status',
    key: 'status',
    title: $t('page.aurora.panel.status'),
  },
  {
    dataIndex: 'root_summary',
    ellipsis: true,
    key: 'summary',
    title: $t('page.aurora.panel.summary'),
  },
  {
    dataIndex: 'updated_at',
    key: 'updated_at',
    title: $t('page.aurora.panel.updatedAt'),
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

function statusColor(value: string) {
  if (['ACTIVE', 'READY'].includes(value)) return 'processing';
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
        <Segmented
          :options="rangeOptions"
          :value="range"
          @change="changeRange"
        />
        <Button :loading="loading" @click="load">
          {{ $t('page.aurora.panel.refresh') }}
        </Button>
      </div>
    </template>

    <Alert
      v-if="failedSources.length"
      class="mb-4"
      :description="failedDescription"
      :message="$t('page.aurora.panel.overview.partialLoadError')"
      show-icon
      type="warning"
    >
      <template #action>
        <Button size="small" @click="load">
          {{ $t('page.aurora.dashboard.retry') }}
        </Button>
      </template>
    </Alert>

    <Skeleton v-if="loading && !initialized" active :paragraph="{ rows: 10 }" />

    <template v-else>
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card :title="$t('page.aurora.panel.overview.systemStatus')">
          <template #extra>
            <Tag :color="status ? 'green' : 'default'">
              {{
                status
                  ? $t('page.aurora.dashboard.online')
                  : $t('page.aurora.panel.overview.unavailable')
              }}
            </Tag>
          </template>
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">
            <Statistic
              :title="$t('page.aurora.panel.overview.activeTasks')"
              :value="status?.active_tasks ?? '--'"
            />
            <Statistic
              :title="$t('page.aurora.panel.overview.activeAgents')"
              :value="status?.active_agents ?? '--'"
            />
            <Statistic
              :title="$t('page.aurora.panel.overview.memoryFacts')"
              :value="memory?.facts ?? '--'"
            />
            <Statistic
              :title="$t('page.aurora.panel.overview.memoryMessages')"
              :value="memory?.window_messages ?? '--'"
            />
          </div>
        </Card>

        <Card :title="$t('page.aurora.panel.overview.queueOverview')">
          <template #extra>
            <Tag
              :color="status?.model_dispatch_active ? 'processing' : 'default'"
            >
              {{
                status?.model_dispatch_active
                  ? $t('page.aurora.panel.overview.dispatching')
                  : $t('page.aurora.panel.overview.dispatchStopped')
              }}
            </Tag>
          </template>
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">
            <Statistic
              :title="$t('page.aurora.panel.overview.pendingActivities')"
              :value="status?.pending_activities ?? '--'"
            />
            <Statistic
              :title="$t('page.aurora.panel.overview.pendingMessages')"
              :value="status?.pending_messages ?? '--'"
            />
            <Statistic
              :title="$t('page.aurora.panel.overview.pendingModel')"
              :value="status?.pending_model_activities ?? '--'"
            />
            <Statistic
              :title="$t('page.aurora.panel.overview.pendingTool')"
              :value="status?.pending_tool_activities ?? '--'"
            />
          </div>
        </Card>

        <Card :title="$t('page.aurora.dashboard.storage')">
          <template #extra>
            <Tag color="orange">
              {{ $t('page.aurora.panel.overview.sampleData') }}
            </Tag>
          </template>
          <div class="mb-4 flex items-end justify-between">
            <Statistic
              :title="$t('page.aurora.panel.overview.totalStorage')"
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
            <Progress
              :percent="Math.round((item.sizeBytes / totalStorage) * 100)"
              :show-info="false"
              size="small"
            />
          </div>
        </Card>
      </section>

      <section
        class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
      >
        <Card size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.requests')
            }}</span>
            <Tag color="orange">{{
              $t('page.aurora.panel.overview.sampleData')
            }}</Tag>
          </div>
          <Statistic :value="sample.requests" />
        </Card>
        <Card size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.cost')
            }}</span>
            <Tag :color="cost ? 'green' : 'default'">
              {{
                cost
                  ? $t('page.aurora.panel.overview.realData')
                  : $t('page.aurora.panel.overview.unavailable')
              }}
            </Tag>
          </div>
          <Statistic :precision="6" :value="cost?.total_cost ?? 0" prefix="$" />
        </Card>
        <Card size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.tokens')
            }}</span>
            <Tag color="orange">{{
              $t('page.aurora.panel.overview.sampleData')
            }}</Tag>
          </div>
          <Statistic :value="totalTokens" />
        </Card>
        <Card size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.latency')
            }}</span>
            <Tag color="orange">{{
              $t('page.aurora.panel.overview.sampleData')
            }}</Tag>
          </div>
          <Statistic :value="sample.averageLatencyMs" suffix="ms" />
        </Card>
        <Card size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.messages')
            }}</span>
            <Tag color="orange">{{
              $t('page.aurora.panel.overview.sampleData')
            }}</Tag>
          </div>
          <Statistic :value="sample.messages" />
        </Card>
        <Card size="small">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground text-sm">{{
              $t('page.aurora.dashboard.cache')
            }}</span>
            <Tag color="orange">{{
              $t('page.aurora.panel.overview.sampleData')
            }}</Tag>
          </div>
          <Statistic :precision="1" :value="sample.cacheHitRate" suffix="%" />
        </Card>
      </section>

      <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card :title="$t('page.aurora.panel.overview.activityTrend')">
          <template #extra
            ><Tag color="orange">{{
              $t('page.aurora.panel.overview.sampleData')
            }}</Tag></template
          >
          <OverviewCharts
            :cost="cost"
            kind="activity"
            :sample="sample"
            :tasks="tasks"
          />
        </Card>
        <Card :title="$t('page.aurora.panel.overview.tokenTrend')">
          <template #extra
            ><Tag color="orange">{{
              $t('page.aurora.panel.overview.sampleData')
            }}</Tag></template
          >
          <OverviewCharts
            :cost="cost"
            kind="tokens"
            :sample="sample"
            :tasks="tasks"
          />
        </Card>
        <Card :title="$t('page.aurora.panel.overview.taskDistribution')">
          <template #extra>
            <Tag :color="failedSources.includes('tasks') ? 'default' : 'green'">
              {{
                failedSources.includes('tasks')
                  ? $t('page.aurora.panel.overview.unavailable')
                  : $t('page.aurora.panel.overview.realData')
              }}
            </Tag>
          </template>
          <OverviewCharts
            :cost="cost"
            kind="tasks"
            :sample="sample"
            :tasks="tasks"
          />
        </Card>
        <Card :title="$t('page.aurora.panel.overview.costDistribution')">
          <template #extra>
            <Tag :color="cost ? 'green' : 'default'">
              {{
                cost
                  ? $t('page.aurora.panel.overview.realData')
                  : $t('page.aurora.panel.overview.unavailable')
              }}
            </Tag>
          </template>
          <OverviewCharts
            :cost="cost"
            kind="cost"
            :sample="sample"
            :tasks="tasks"
          />
        </Card>
      </section>

      <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          class="overflow-hidden xl:col-span-2"
          :title="$t('page.aurora.panel.overview.recentTasks')"
        >
          <div class="overflow-x-auto">
            <Table
              :columns="taskColumns"
              :data-source="recentTasks"
              :pagination="false"
              row-key="task_id"
              :scroll="{ x: 720 }"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <Tag
                  v-if="column.key === 'status'"
                  :color="statusColor(record.status)"
                >
                  {{ record.status }}
                </Tag>
                <template v-else-if="column.key === 'updated_at'">
                  {{ formatDate(record.updated_at) }}
                </template>
              </template>
              <template #emptyText
                ><Empty :description="$t('page.aurora.panel.empty')"
              /></template>
            </Table>
          </div>
        </Card>

        <Card :title="$t('page.aurora.panel.overview.runtime')">
          <div class="space-y-4">
            <div class="flex justify-between gap-4">
              <span>{{ $t('page.aurora.panel.overview.modelDispatch') }}</span>
              <Tag :color="status?.model_dispatch_active ? 'green' : 'default'">
                {{ status?.model_dispatch_active ? 'ON' : 'OFF' }}
              </Tag>
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
        </Card>
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
