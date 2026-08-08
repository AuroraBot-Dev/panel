<script lang="ts" setup>
import type { DashboardSnapshot, TimeRange } from '#/types/aurora';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Card,
  message,
  Modal,
  Progress,
  Segmented,
  Select,
  Skeleton,
  Statistic,
  Tag,
} from 'ant-design-vue';

import { apiMode } from '#/api/config';
import { $t } from '#/locales';
import {
  getDashboardSnapshot,
  requestAgentRestart,
} from '#/services/dashboard';

const range = ref<TimeRange>('24h');
const selectedAgentId = ref<string>();
const snapshot = ref<DashboardSnapshot>();
const loading = ref(true);
const error = ref(false);
let controller: AbortController | undefined;

const selectedAgent = computed(() =>
  snapshot.value?.agents.find((agent) => agent.id === selectedAgentId.value),
);
const maxRequests = computed(() =>
  Math.max(...(snapshot.value?.trend.map((point) => point.requests) ?? [1]), 1),
);
const maxStorage = computed(() =>
  Math.max(
    ...(snapshot.value?.metrics.storage.map((item) => item.sizeBytes) ?? [1]),
    1,
  ),
);

async function loadDashboard() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  error.value = false;
  try {
    const data = await getDashboardSnapshot(
      selectedAgentId.value,
      range.value,
      controller.signal,
    );
    snapshot.value = data;
    selectedAgentId.value ||= data.agents[0]?.id;
  } catch (loadError) {
    if ((loadError as Error).name !== 'CanceledError') error.value = true;
  } finally {
    loading.value = false;
  }
}

function changeAgent(value: unknown) {
  if (typeof value !== 'string') return;
  selectedAgentId.value = value;
  void loadDashboard();
}

function changeRange(value: number | string) {
  range.value = value as TimeRange;
  void loadDashboard();
}

function confirmRestart() {
  if (!selectedAgentId.value) return;
  Modal.confirm({
    title: $t('page.aurora.dashboard.restartTitle'),
    content: $t('page.aurora.dashboard.restartDescription'),
    okButtonProps: { danger: true },
    async onOk() {
      await requestAgentRestart(selectedAgentId.value!);
      message.success($t('page.aurora.dashboard.restartAccepted'));
    },
  });
}

function statusText(status?: string) {
  return $t(`page.aurora.dashboard.${status ?? 'offline'}`);
}

function formatCount(value = 0) {
  return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(
    value,
  );
}

function formatBytes(value = 0) {
  if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(1)} GB`;
}

function formatUptime(value = 0) {
  const days = Math.floor(value / 86_400);
  const hours = Math.floor((value % 86_400) / 3600);
  return `${days}d ${hours}h`;
}

onMounted(loadDashboard);
onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <Page
    :description="$t('page.aurora.dashboard.subtitle')"
    :title="$t('page.aurora.dashboard.title')"
  >
    <template #title>
      <div class="flex items-center gap-2 text-lg font-semibold">
        {{ $t('page.aurora.dashboard.title') }}
        <Tag v-if="apiMode === 'mock'" color="orange">
          {{ $t('page.aurora.dashboard.mock') }}
        </Tag>
      </div>
    </template>

    <template #extra>
      <div
        class="dashboard-actions flex flex-wrap items-center justify-end gap-2"
      >
        <Select
          :aria-label="$t('page.aurora.dashboard.agent')"
          :loading="loading"
          :options="
            snapshot?.agents.map((item) => ({
              label: item.name,
              value: item.id,
            }))
          "
          :value="selectedAgentId"
          class="w-44"
          @change="changeAgent"
        />
        <Segmented
          :options="['24h', '7d', '30d']"
          :value="range"
          @change="changeRange"
        />
        <Button danger :disabled="!selectedAgentId" @click="confirmRestart">
          <IconifyIcon icon="lucide:rotate-cw" />
          {{ $t('page.aurora.dashboard.restart') }}
        </Button>
      </div>
    </template>

    <Alert
      v-if="error"
      class="mb-4"
      :message="$t('page.aurora.dashboard.loadError')"
      show-icon
      type="error"
    >
      <template #action>
        <Button size="small" @click="loadDashboard">
          {{ $t('page.aurora.dashboard.retry') }}
        </Button>
      </template>
    </Alert>

    <Skeleton v-if="loading && !snapshot" active :paragraph="{ rows: 10 }" />

    <template v-else-if="snapshot">
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card :title="$t('page.aurora.dashboard.agent')">
          <div class="flex items-center gap-4">
            <div
              class="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full text-2xl"
            >
              <IconifyIcon icon="lucide:bot" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-lg font-semibold">
                {{ selectedAgent?.name }}
              </div>
              <Tag
                :color="selectedAgent?.status === 'online' ? 'green' : 'orange'"
              >
                {{ statusText(selectedAgent?.status) }}
              </Tag>
            </div>
          </div>
          <div class="mt-5 grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <div class="text-muted-foreground text-xs">
                {{ $t('page.aurora.dashboard.uptime') }}
              </div>
              <div class="mt-1 font-medium">
                {{ formatUptime(selectedAgent?.uptimeSeconds) }}
              </div>
            </div>
            <div>
              <div class="text-muted-foreground text-xs">
                {{ $t('page.aurora.dashboard.version') }}
              </div>
              <div class="mt-1 font-medium">{{ selectedAgent?.version }}</div>
            </div>
          </div>
        </Card>

        <Card title="Capabilities">
          <div class="mb-4 text-2xl font-semibold">
            {{ selectedAgent?.features.length ?? 0 }}
          </div>
          <div class="flex flex-wrap gap-2">
            <Tag v-for="item in selectedAgent?.features" :key="item">
              {{ item }}
            </Tag>
          </div>
        </Card>

        <Card :title="$t('page.aurora.dashboard.storage')">
          <div
            v-for="item in snapshot.metrics.storage"
            :key="item.label"
            class="mb-3 last:mb-0"
          >
            <div class="mb-1 flex items-center justify-between text-sm">
              <span>{{ item.label }}</span>
              <span class="text-muted-foreground">
                {{ formatBytes(item.sizeBytes) }}
              </span>
            </div>
            <Progress
              :percent="Math.round((item.sizeBytes / maxStorage) * 100)"
              :show-info="false"
              size="small"
            />
          </div>
        </Card>
      </section>

      <section
        class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
      >
        <Card>
          <Statistic
            :title="$t('page.aurora.dashboard.requests')"
            :value="snapshot.metrics.requests"
          />
        </Card>
        <Card>
          <Statistic
            :precision="2"
            :title="$t('page.aurora.dashboard.cost')"
            :value="snapshot.metrics.cost"
            prefix="¥"
          />
        </Card>
        <Card>
          <Statistic
            :title="$t('page.aurora.dashboard.tokens')"
            :value="
              snapshot.metrics.inputTokens + snapshot.metrics.outputTokens
            "
          />
        </Card>
        <Card>
          <Statistic
            :title="$t('page.aurora.dashboard.latency')"
            :value="snapshot.metrics.averageLatencyMs"
            suffix="ms"
          />
        </Card>
        <Card>
          <Statistic
            :title="$t('page.aurora.dashboard.messages')"
            :value="snapshot.metrics.messages"
          />
        </Card>
        <Card>
          <Statistic
            :precision="1"
            :title="$t('page.aurora.dashboard.cache')"
            :value="snapshot.metrics.cacheHitRate"
            suffix="%"
          />
        </Card>
      </section>

      <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card class="xl:col-span-3" :title="$t('page.aurora.dashboard.trend')">
          <div
            class="bar-chart"
            role="img"
            :aria-label="$t('page.aurora.dashboard.trend')"
          >
            <div
              v-for="point in snapshot.trend"
              :key="point.label"
              class="bar-column"
            >
              <div class="bar-track">
                <span
                  :style="{
                    height: `${Math.max((point.requests / maxRequests) * 100, 4)}%`,
                  }"
                ></span>
              </div>
              <small>{{ point.label }}</small>
            </div>
          </div>
        </Card>

        <Card
          class="xl:col-span-2"
          :title="$t('page.aurora.dashboard.tokenTrend')"
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="bg-muted rounded-md p-4">
              <div
                class="text-muted-foreground mb-2 flex items-center gap-2 text-sm"
              >
                <IconifyIcon icon="lucide:arrow-down-left" />
                {{ $t('page.aurora.dashboard.input') }}
              </div>
              <div class="text-2xl font-semibold">
                {{ formatCount(snapshot.metrics.inputTokens) }}
              </div>
            </div>
            <div class="bg-muted rounded-md p-4">
              <div
                class="text-muted-foreground mb-2 flex items-center gap-2 text-sm"
              >
                <IconifyIcon icon="lucide:arrow-up-right" />
                {{ $t('page.aurora.dashboard.output') }}
              </div>
              <div class="text-2xl font-semibold">
                {{ formatCount(snapshot.metrics.outputTokens) }}
              </div>
            </div>
          </div>
          <Progress
            class="mt-6"
            :percent="
              Math.round(
                (snapshot.metrics.inputTokens /
                  Math.max(
                    snapshot.metrics.inputTokens +
                      snapshot.metrics.outputTokens,
                    1,
                  )) *
                  100,
              )
            "
            :show-info="false"
          />
        </Card>
      </section>
    </template>
  </Page>
</template>

<style scoped>
.bar-chart {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  height: 220px;
}

.bar-column {
  display: grid;
  flex: 1;
  gap: 8px;
  min-width: 14px;
  text-align: center;
}

.bar-track {
  position: relative;
  height: 185px;
  overflow: hidden;
  background: hsl(var(--muted));
  border-radius: 4px 4px 0 0;
}

.bar-track span {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  background: hsl(var(--primary));
  border-radius: 4px 4px 0 0;
}

.bar-column small {
  font-size: 10px;
  color: hsl(var(--muted-foreground));
}

@media (max-width: 720px) {
  .dashboard-actions {
    justify-content: flex-start;
  }

  .dashboard-actions > * {
    width: 100%;
  }
}
</style>
