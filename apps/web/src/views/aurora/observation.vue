<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type {
  AgentDetail,
  AgentTransport,
  CausalEvent,
  TaskDetail,
  TaskTransport,
} from '#/api';

import { h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDrawer,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
} from 'naive-ui';

import { getAgent, getTask, listAgents, listEvents, listTasks } from '#/api';
import { $t } from '#/locales';

const activeTab = ref('tasks');
const loading = ref(false);
const error = ref('');
const tasks = ref<TaskTransport[]>([]);
const agents = ref<AgentTransport[]>([]);
const events = ref<CausalEvent[]>([]);
const taskStatus = ref<string>();
const eventSession = ref('');
const eventTask = ref('');
const eventType = ref('');
const afterId = ref(0);
const limit = ref(64);
const taskDetail = ref<TaskDetail>();
const agentDetail = ref<AgentDetail>();
const drawerOpen = ref(false);

const statusOptions = [
  'ACTIVE',
  'COMPLETED',
  'SILENT',
  'CANCELLED',
  'BUDGET_EXHAUSTED',
  'ERROR',
].map((value) => ({ label: value, value }));

const taskColumns: DataTableColumns<TaskTransport> = [
  { key: 'task_id', title: 'Task ID', ellipsis: { tooltip: true } },
  {
    key: 'status',
    title: $t('page.aurora.panel.status'),
    render: (row) =>
      h(NTag, { type: 'default' }, { default: () => row.status }),
  },
  { key: 'session_id', title: 'Session', ellipsis: { tooltip: true } },
  {
    key: 'root_summary',
    title: $t('page.aurora.panel.summary'),
    ellipsis: { tooltip: true },
  },
  {
    key: 'action',
    title: $t('page.aurora.panel.action'),
    width: 90,
    render: (row) =>
      h(
        NButton,
        {
          quaternary: true,
          size: 'small',
          type: 'primary',
          onClick: () => showTask(row.task_id),
        },
        { default: () => $t('page.aurora.panel.detail') },
      ),
  },
];

const agentColumns: DataTableColumns<AgentTransport> = [
  { key: 'agent_id', title: 'Agent ID', ellipsis: { tooltip: true } },
  { key: 'profile_id', title: 'Profile' },
  { key: 'task_id', title: 'Task', ellipsis: { tooltip: true } },
  {
    key: 'status',
    title: $t('page.aurora.panel.status'),
    render: (row) =>
      h(NTag, { type: 'default' }, { default: () => row.status }),
  },
  {
    key: 'action',
    title: $t('page.aurora.panel.action'),
    width: 90,
    render: (row) =>
      h(
        NButton,
        {
          quaternary: true,
          size: 'small',
          type: 'primary',
          onClick: () => showAgent(row.agent_id),
        },
        { default: () => $t('page.aurora.panel.detail') },
      ),
  },
];

const eventColumns: DataTableColumns<CausalEvent> = [
  { key: 'event_id', title: 'Event ID', ellipsis: { tooltip: true } },
  { key: 'type', title: 'Type' },
  { key: 'task_id', title: 'Task', ellipsis: { tooltip: true } },
  {
    key: 'summary',
    title: $t('page.aurora.panel.summary'),
    ellipsis: { tooltip: true },
  },
  { key: 'created_at', title: $t('page.aurora.panel.createdAt') },
];

const supervisionColumns: DataTableColumns<
  TaskDetail['supervision_tree'][number]
> = [
  { key: 'agent_id', title: 'Agent ID', ellipsis: { tooltip: true } },
  { key: 'profile_id', title: 'Profile' },
  {
    key: 'status',
    title: $t('page.aurora.panel.status'),
    width: 110,
    render: (row) =>
      h(NTag, { type: 'default' }, { default: () => row.status }),
  },
  { key: 'depth', title: 'Depth', width: 80 },
  { key: 'parent_agent_id', title: 'Parent', ellipsis: { tooltip: true } },
  {
    key: 'children',
    title: 'Children',
    width: 90,
    render: (row) => String(row.children?.length ?? 0),
  },
  {
    key: 'last_summary',
    title: $t('page.aurora.panel.summary'),
    ellipsis: { tooltip: true },
  },
];

const childColumns: DataTableColumns<AgentTransport> = [
  { key: 'agent_id', title: 'Agent ID', ellipsis: { tooltip: true } },
  { key: 'profile_id', title: 'Profile' },
  {
    key: 'status',
    title: $t('page.aurora.panel.status'),
    width: 110,
    render: (row) =>
      h(NTag, { type: 'default' }, { default: () => row.status }),
  },
  { key: 'depth', title: 'Depth', width: 80 },
  {
    key: 'last_summary',
    title: $t('page.aurora.panel.summary'),
    ellipsis: { tooltip: true },
  },
];

const messageColumns: DataTableColumns<AgentDetail['messages'][number]> = [
  { key: 'message_id', title: 'Message ID', ellipsis: { tooltip: true } },
  { key: 'type', title: 'Type' },
  {
    key: 'status',
    title: $t('page.aurora.panel.status'),
    width: 110,
    render: (row) =>
      h(NTag, { type: 'default' }, { default: () => row.status }),
  },
  { key: 'task_id', title: 'Task', ellipsis: { tooltip: true } },
  { key: 'created_at', title: $t('page.aurora.panel.createdAt') },
];

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== '' && item !== undefined,
    ),
  );
}

async function loadTasks() {
  loading.value = true;
  error.value = '';
  try {
    tasks.value = await listTasks(
      compact({ limit: limit.value, status: taskStatus.value }),
    );
  } catch (loadError) {
    error.value = (loadError as Error).message;
  } finally {
    loading.value = false;
  }
}

async function loadAgents() {
  loading.value = true;
  error.value = '';
  try {
    agents.value = await listAgents(limit.value);
  } catch (loadError) {
    error.value = (loadError as Error).message;
  } finally {
    loading.value = false;
  }
}

async function loadEvents() {
  loading.value = true;
  error.value = '';
  try {
    events.value = await listEvents(
      compact({
        after_id: afterId.value,
        event_type: eventType.value,
        limit: limit.value,
        session_id: eventSession.value,
        task_id: eventTask.value,
      }),
    );
  } catch (loadError) {
    error.value = (loadError as Error).message;
  } finally {
    loading.value = false;
  }
}

async function showTask(taskId: string) {
  taskDetail.value = await getTask(taskId);
  agentDetail.value = undefined;
  drawerOpen.value = true;
}

async function showAgent(agentId: string) {
  agentDetail.value = await getAgent(agentId);
  taskDetail.value = undefined;
  drawerOpen.value = true;
}

function reload() {
  if (activeTab.value === 'agents') return loadAgents();
  if (activeTab.value === 'events') return loadEvents();
  return loadTasks();
}

onMounted(async () => {
  await Promise.all([loadTasks(), loadAgents(), loadEvents()]);
});
</script>

<template>
  <Page>
    <template #extra>
      <NSpace>
        <NInputNumber v-model:value="limit" :max="500" :min="1" />
        <NButton :loading="loading" @click="reload">
          {{ $t('page.aurora.panel.refresh') }}
        </NButton>
      </NSpace>
    </template>

    <NAlert v-if="error" class="mb-4" :title="error" type="error" />
    <NCard>
      <NTabs v-model:value="activeTab">
        <NTabPane name="tasks" :tab="$t('page.aurora.panel.observation.tasks')">
          <div class="mb-4 flex gap-2">
            <NSelect
              v-model:value="taskStatus"
              clearable
              class="w-56"
              :options="statusOptions"
              :placeholder="$t('page.aurora.panel.status')"
            />
            <NButton @click="loadTasks">
              {{ $t('page.aurora.panel.apply') }}
            </NButton>
          </div>
          <NDataTable
            :columns="taskColumns"
            :data="tasks"
            :loading="loading"
            size="small"
          />
        </NTabPane>

        <NTabPane
          name="agents"
          :tab="$t('page.aurora.panel.observation.agents')"
        >
          <NDataTable
            :columns="agentColumns"
            :data="agents"
            :loading="loading"
            size="small"
          />
        </NTabPane>

        <NTabPane
          name="events"
          :tab="$t('page.aurora.panel.observation.events')"
        >
          <div class="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
            <NInput
              v-model:value="eventSession"
              clearable
              placeholder="Session ID"
            />
            <NInput v-model:value="eventTask" clearable placeholder="Task ID" />
            <NInput
              v-model:value="eventType"
              clearable
              placeholder="Event type"
            />
            <NInputNumber
              v-model:value="afterId"
              :min="0"
              placeholder="After ID"
            />
            <NButton @click="loadEvents">
              {{ $t('page.aurora.panel.apply') }}
            </NButton>
          </div>
          <NDataTable
            :columns="eventColumns"
            :data="events"
            :loading="loading"
            size="small"
          />
        </NTabPane>
      </NTabs>
    </NCard>

    <NDrawer
      v-model:show="drawerOpen"
      :title="$t('page.aurora.panel.detail')"
      width="720"
    >
      <template v-if="taskDetail">
        <NDescriptions :column="1" bordered size="small">
          <NDescriptionsItem label="Task ID">
            {{ taskDetail.task.task_id }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.aurora.panel.status')">
            {{ taskDetail.task.status }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Session">
            {{ taskDetail.task.session_id }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.aurora.panel.summary')">
            {{ taskDetail.task.root_summary }}
          </NDescriptionsItem>
        </NDescriptions>
        <h3 class="mt-5 font-semibold">Budget</h3>
        <NDescriptions :column="2" bordered size="small">
          <NDescriptionsItem
            v-for="(item, key) in taskDetail.budget"
            :key="key"
            :label="key"
          >
            {{ String(item) }}
          </NDescriptionsItem>
        </NDescriptions>
        <h3 class="mt-5 font-semibold">Supervision tree</h3>
        <NDataTable
          :columns="supervisionColumns"
          :data="taskDetail.supervision_tree"
          :pagination="false"
          size="small"
        />
        <h3 class="mt-5 font-semibold">Causal events</h3>
        <NDataTable
          :columns="eventColumns"
          :data="taskDetail.events"
          :pagination="false"
          size="small"
        />
      </template>
      <template v-else-if="agentDetail">
        <NDescriptions :column="1" bordered size="small">
          <NDescriptionsItem label="Agent ID">
            {{ agentDetail.agent.agent_id }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Profile">
            {{ agentDetail.agent.profile_id }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.aurora.panel.status')">
            {{ agentDetail.agent.status }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.aurora.panel.summary')">
            {{ agentDetail.agent.last_summary }}
          </NDescriptionsItem>
        </NDescriptions>
        <h3 class="mt-5 font-semibold">Children</h3>
        <NDataTable
          :columns="childColumns"
          :data="agentDetail.children"
          :pagination="false"
          size="small"
        />
        <h3 class="mt-5 font-semibold">Messages</h3>
        <NDataTable
          :columns="messageColumns"
          :data="agentDetail.messages"
          :pagination="false"
          size="small"
        />
      </template>
    </NDrawer>
  </Page>
</template>

<style scoped></style>
