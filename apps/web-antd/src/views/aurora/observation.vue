<script lang="ts" setup>
import type {
  AgentDetail,
  AgentTransport,
  CausalEvent,
  TaskDetail,
  TaskTransport,
} from '#/types/aurora';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

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
  <Page
    :description="$t('page.aurora.features.observation.description')"
    :title="$t('page.aurora.features.observation.title')"
  >
    <template #extra>
      <Space>
        <InputNumber v-model:value="limit" :max="500" :min="1" />
        <Button :loading="loading" @click="reload">
          {{ $t('page.aurora.panel.refresh') }}
        </Button>
      </Space>
    </template>

    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Card>
      <Tabs v-model:active-key="activeTab">
        <Tabs.TabPane
          key="tasks"
          :tab="$t('page.aurora.panel.observation.tasks')"
        >
          <div class="mb-4 flex gap-2">
            <Select
              v-model:value="taskStatus"
              allow-clear
              class="w-56"
              :options="
                [
                  'ACTIVE',
                  'COMPLETED',
                  'SILENT',
                  'CANCELLED',
                  'BUDGET_EXHAUSTED',
                  'ERROR',
                ].map((value) => ({ label: value, value }))
              "
              :placeholder="$t('page.aurora.panel.status')"
            />
            <Button @click="loadTasks">{{
              $t('page.aurora.panel.apply')
            }}</Button>
          </div>
          <Table
            :columns="[
              {
                title: 'Task ID',
                dataIndex: 'task_id',
                key: 'task_id',
                ellipsis: true,
              },
              {
                title: $t('page.aurora.panel.status'),
                dataIndex: 'status',
                key: 'status',
              },
              {
                title: 'Session',
                dataIndex: 'session_id',
                key: 'session_id',
                ellipsis: true,
              },
              {
                title: $t('page.aurora.panel.summary'),
                dataIndex: 'root_summary',
                key: 'summary',
                ellipsis: true,
              },
              {
                title: $t('page.aurora.panel.action'),
                key: 'action',
                width: 90,
              },
            ]"
            :data-source="tasks"
            :loading="loading"
            row-key="task_id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <Tag v-if="column.key === 'status'">{{ record.status }}</Tag>
              <Button
                v-if="column.key === 'action'"
                type="link"
                @click="showTask(record.task_id)"
              >
                {{ $t('page.aurora.panel.detail') }}
              </Button>
            </template>
          </Table>
        </Tabs.TabPane>

        <Tabs.TabPane
          key="agents"
          :tab="$t('page.aurora.panel.observation.agents')"
        >
          <Table
            :columns="[
              {
                title: 'Agent ID',
                dataIndex: 'agent_id',
                key: 'agent_id',
                ellipsis: true,
              },
              { title: 'Profile', dataIndex: 'profile_id', key: 'profile_id' },
              {
                title: 'Task',
                dataIndex: 'task_id',
                key: 'task_id',
                ellipsis: true,
              },
              {
                title: $t('page.aurora.panel.status'),
                dataIndex: 'status',
                key: 'status',
              },
              {
                title: $t('page.aurora.panel.action'),
                key: 'action',
                width: 90,
              },
            ]"
            :data-source="agents"
            :loading="loading"
            row-key="agent_id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <Tag v-if="column.key === 'status'">{{ record.status }}</Tag>
              <Button
                v-if="column.key === 'action'"
                type="link"
                @click="showAgent(record.agent_id)"
              >
                {{ $t('page.aurora.panel.detail') }}
              </Button>
            </template>
          </Table>
        </Tabs.TabPane>

        <Tabs.TabPane
          key="events"
          :tab="$t('page.aurora.panel.observation.events')"
        >
          <div class="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
            <Input
              v-model:value="eventSession"
              allow-clear
              placeholder="Session ID"
            />
            <Input
              v-model:value="eventTask"
              allow-clear
              placeholder="Task ID"
            />
            <Input
              v-model:value="eventType"
              allow-clear
              placeholder="Event type"
            />
            <InputNumber
              v-model:value="afterId"
              :min="0"
              placeholder="After ID"
            />
            <Button @click="loadEvents">{{
              $t('page.aurora.panel.apply')
            }}</Button>
          </div>
          <Table
            :columns="[
              {
                title: 'Event ID',
                dataIndex: 'event_id',
                key: 'event_id',
                ellipsis: true,
              },
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
            :data-source="events"
            :loading="loading"
            row-key="event_id"
            size="small"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Drawer
      v-model:open="drawerOpen"
      :title="$t('page.aurora.panel.detail')"
      width="720"
    >
      <template v-if="taskDetail">
        <Descriptions :column="1" bordered size="small">
          <Descriptions.Item label="Task ID">{{
            taskDetail.task.task_id
          }}</Descriptions.Item>
          <Descriptions.Item :label="$t('page.aurora.panel.status')">{{
            taskDetail.task.status
          }}</Descriptions.Item>
          <Descriptions.Item label="Session">{{
            taskDetail.task.session_id
          }}</Descriptions.Item>
          <Descriptions.Item :label="$t('page.aurora.panel.summary')">{{
            taskDetail.task.root_summary
          }}</Descriptions.Item>
        </Descriptions>
        <h3 class="mt-5 font-semibold">Budget</h3>
        <pre class="json-preview">{{
          JSON.stringify(taskDetail.budget, null, 2)
        }}</pre>
        <h3 class="mt-5 font-semibold">Supervision tree</h3>
        <pre class="json-preview">{{
          JSON.stringify(taskDetail.supervision_tree, null, 2)
        }}</pre>
        <h3 class="mt-5 font-semibold">Causal events</h3>
        <pre class="json-preview">{{
          JSON.stringify(taskDetail.events, null, 2)
        }}</pre>
      </template>
      <template v-else-if="agentDetail">
        <Descriptions :column="1" bordered size="small">
          <Descriptions.Item label="Agent ID">{{
            agentDetail.agent.agent_id
          }}</Descriptions.Item>
          <Descriptions.Item label="Profile">{{
            agentDetail.agent.profile_id
          }}</Descriptions.Item>
          <Descriptions.Item :label="$t('page.aurora.panel.status')">{{
            agentDetail.agent.status
          }}</Descriptions.Item>
          <Descriptions.Item :label="$t('page.aurora.panel.summary')">{{
            agentDetail.agent.last_summary
          }}</Descriptions.Item>
        </Descriptions>
        <h3 class="mt-5 font-semibold">Children</h3>
        <pre class="json-preview">{{
          JSON.stringify(agentDetail.children, null, 2)
        }}</pre>
        <h3 class="mt-5 font-semibold">Messages</h3>
        <pre class="json-preview">{{
          JSON.stringify(agentDetail.messages, null, 2)
        }}</pre>
      </template>
    </Drawer>
  </Page>
</template>

<style scoped>
.json-preview {
  max-height: 360px;
  padding: 12px;
  overflow: auto;
  font-size: 12px;
  background: hsl(var(--muted));
  border-radius: 6px;
}
</style>
