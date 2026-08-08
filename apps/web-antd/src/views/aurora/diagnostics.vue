<script lang="ts" setup>
import type { OperationCatalog, PanelHealth } from '#/types/aurora';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'ant-design-vue';

import {
  getApiHealth,
  getOperationCatalog,
  getRootHealth,
  getSystemInfo,
  injectEvent,
  operationCoverageKeys,
  operationKey,
  pumpEngine,
  shutdownEngine,
} from '#/api';
import JsonView from '#/components/aurora/json-view.vue';
import { $t } from '#/locales';

const apiHealth = ref<PanelHealth>();
const rootHealth = ref<PanelHealth>();
const catalog = ref<OperationCatalog>();
const systemInfo = ref<OperationCatalog>();
const loading = ref(false);
const error = ref('');
const ampText = ref('{\n  "header": {},\n  "payload": {}\n}');
const maxTurns = ref(8);
const shutdownPhrase = ref('');
const lastResult = ref<unknown>();
const unknownOperations = computed(() =>
  (catalog.value?.operations ?? []).filter(
    (item) => !operationCoverageKeys.has(operationKey(item.method, item.path)),
  ),
);
const catalogsMatch = computed(
  () =>
    JSON.stringify(catalog.value?.operations ?? []) ===
    JSON.stringify(systemInfo.value?.operations ?? []),
);

async function load() {
  loading.value = true;
  error.value = '';
  const results = await Promise.allSettled([
    getApiHealth(),
    getRootHealth(),
    getOperationCatalog(),
    getSystemInfo(),
  ]);
  if (results[0].status === 'fulfilled') apiHealth.value = results[0].value;
  if (results[1].status === 'fulfilled') rootHealth.value = results[1].value;
  if (results[2].status === 'fulfilled') catalog.value = results[2].value;
  if (results[3].status === 'fulfilled') systemInfo.value = results[3].value;
  const rejected = results.find((item) => item.status === 'rejected');
  if (rejected?.status === 'rejected') {
    error.value = (rejected.reason as Error).message;
  }
  loading.value = false;
}

async function submitAmp() {
  let value: unknown;
  try {
    value = JSON.parse(ampText.value);
  } catch {
    message.error($t('page.aurora.panel.diagnostics.invalidJson'));
    return;
  }
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    message.error($t('page.aurora.panel.diagnostics.objectRequired'));
    return;
  }
  loading.value = true;
  try {
    lastResult.value = await injectEvent(value as Record<string, unknown>);
    message.success($t('page.aurora.panel.diagnostics.completed'));
  } finally {
    loading.value = false;
  }
}

function confirmPump() {
  Modal.confirm({
    content: `${$t('page.aurora.panel.diagnostics.pumpHelp')} ${maxTurns.value}`,
    title: 'Engine pump',
    async onOk() {
      loading.value = true;
      try {
        lastResult.value = await pumpEngine(maxTurns.value);
      } finally {
        loading.value = false;
      }
    },
  });
}

function confirmShutdown() {
  if (shutdownPhrase.value !== 'SHUTDOWN') {
    message.error($t('page.aurora.panel.diagnostics.shutdownPhrase'));
    return;
  }
  Modal.confirm({
    content: $t('page.aurora.panel.diagnostics.shutdownHelp'),
    okButtonProps: { danger: true },
    title: 'SHUTDOWN AuroraBot',
    async onOk() {
      lastResult.value = await shutdownEngine();
    },
  });
}

onMounted(load);
</script>

<template>
  <Page
    :description="$t('page.aurora.features.diagnostics.description')"
    :title="$t('page.aurora.features.diagnostics.title')"
  >
    <template #extra
      ><Button :loading="loading" @click="load">{{
        $t('page.aurora.panel.refresh')
      }}</Button></template
    >
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Alert
      v-if="unknownOperations.length"
      class="mb-4"
      :message="$t('page.aurora.panel.diagnostics.unmapped')"
      :description="
        unknownOperations
          .map((item) => operationKey(item.method, item.path))
          .join(', ')
      "
      show-icon
      type="warning"
    />
    <section class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card title="/api/health"
        ><Tag :color="apiHealth?.ok ? 'green' : 'red'">{{
          apiHealth?.status ?? 'offline'
        }}</Tag>
        <div class="mt-2">{{ apiHealth?.profile }}</div></Card
      >
      <Card title="/healthz"
        ><Tag :color="rootHealth?.ok ? 'green' : 'red'">{{
          rootHealth?.status ?? 'offline'
        }}</Tag>
        <div class="mt-2">{{ rootHealth?.profile }}</div></Card
      >
      <Card title="Operation coverage"
        ><Tag :color="unknownOperations.length ? 'orange' : 'green'"
          >{{ catalog?.count ?? 0 }} / {{ operationCoverageKeys.size }}</Tag
        >
        <div class="mt-2">
          Catalogs: {{ catalogsMatch ? 'match' : 'mismatch' }}
        </div></Card
      >
    </section>

    <Card>
      <Tabs>
        <Tabs.TabPane key="catalog" tab="Operation catalog">
          <Table
            :columns="[
              {
                title: 'Method',
                dataIndex: 'method',
                key: 'method',
                width: 90,
              },
              { title: 'Path', dataIndex: 'path', key: 'path' },
              { title: 'Name', dataIndex: 'name', key: 'name' },
              { title: 'Scope', dataIndex: 'scope', key: 'scope' },
              { title: 'Summary', dataIndex: 'summary', key: 'summary' },
            ]"
            :data-source="catalog?.operations ?? []"
            :pagination="false"
            row-key="name"
            size="small"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="amp" tab="AMP injection">
          <Alert
            class="mb-4"
            :message="$t('page.aurora.panel.diagnostics.mutationWarning')"
            show-icon
            type="warning"
          />
          <Input.TextArea
            v-model:value="ampText"
            :auto-size="{ minRows: 14, maxRows: 28 }"
          />
          <Button
            class="mt-3"
            type="primary"
            :loading="loading"
            @click="submitAmp"
            >Inject AMP</Button
          >
        </Tabs.TabPane>
        <Tabs.TabPane key="pump" tab="Engine pump">
          <Space>
            <InputNumber v-model:value="maxTurns" :max="100" :min="1" />
            <Button type="primary" :loading="loading" @click="confirmPump"
              >Pump</Button
            >
          </Space>
        </Tabs.TabPane>
        <Tabs.TabPane key="shutdown" tab="Shutdown">
          <Alert
            class="mb-4"
            :message="$t('page.aurora.panel.diagnostics.shutdownHelp')"
            show-icon
            type="error"
          />
          <Space.Compact>
            <Input v-model:value="shutdownPhrase" placeholder="SHUTDOWN" />
            <Button danger @click="confirmShutdown">Shutdown</Button>
          </Space.Compact>
        </Tabs.TabPane>
        <Tabs.TabPane key="result" tab="Last result"
          ><JsonView :value="lastResult"
        /></Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
