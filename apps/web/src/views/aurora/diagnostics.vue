<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { OperationCatalog, PanelHealth } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NInput,
  NInputNumber,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
} from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
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

const catalogColumns: DataTableColumns<OperationCatalog['operations'][number]> =
  [
    { key: 'method', title: 'Method', width: 90 },
    { key: 'path', title: 'Path' },
    { key: 'name', title: 'Name' },
    { key: 'scope', title: 'Scope' },
    { key: 'summary', title: 'Summary' },
  ];

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
  dialog.warning({
    content: `${$t('page.aurora.panel.diagnostics.pumpHelp')} ${maxTurns.value}`,
    title: 'Engine pump',
    async onPositiveClick() {
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
  dialog.error({
    content: $t('page.aurora.panel.diagnostics.shutdownHelp'),
    title: 'SHUTDOWN AuroraBot',
    async onPositiveClick() {
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
    <template #extra>
      <NButton :loading="loading" @click="load">
        {{ $t('page.aurora.panel.refresh') }}
      </NButton>
    </template>
    <NAlert v-if="error" class="mb-4" :title="error" type="error" />
    <NAlert
      v-if="unknownOperations.length"
      class="mb-4"
      :title="$t('page.aurora.panel.diagnostics.unmapped')"
      type="warning"
    >
      {{
        unknownOperations
          .map((item) => operationKey(item.method, item.path))
          .join(', ')
      }}
    </NAlert>
    <section class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <NCard title="/api/health">
        <NTag :type="apiHealth?.ok ? 'success' : 'error'">
          {{ apiHealth?.status ?? 'offline' }}
        </NTag>
        <div class="mt-2">{{ apiHealth?.profile }}</div>
      </NCard>
      <NCard title="/healthz">
        <NTag :type="rootHealth?.ok ? 'success' : 'error'">
          {{ rootHealth?.status ?? 'offline' }}
        </NTag>
        <div class="mt-2">{{ rootHealth?.profile }}</div>
      </NCard>
      <NCard title="Operation coverage">
        <NTag :type="unknownOperations.length ? 'warning' : 'success'">
          {{ catalog?.count ?? 0 }} / {{ operationCoverageKeys.size }}
        </NTag>
        <div class="mt-2">
          Catalogs: {{ catalogsMatch ? 'match' : 'mismatch' }}
        </div>
      </NCard>
    </section>

    <NCard>
      <NTabs>
        <NTabPane name="catalog" tab="Operation catalog">
          <NDataTable
            :columns="catalogColumns"
            :data="catalog?.operations ?? []"
            :pagination="false"
            size="small"
          />
        </NTabPane>
        <NTabPane name="amp" tab="AMP injection">
          <NAlert
            class="mb-4"
            :title="$t('page.aurora.panel.diagnostics.mutationWarning')"
            type="warning"
          />
          <NInput
            v-model:value="ampText"
            type="textarea"
            :autosize="{ minRows: 14, maxRows: 28 }"
          />
          <NButton
            class="mt-3"
            type="primary"
            :loading="loading"
            @click="submitAmp"
          >
            Inject AMP
          </NButton>
        </NTabPane>
        <NTabPane name="pump" tab="Engine pump">
          <NSpace>
            <NInputNumber v-model:value="maxTurns" :max="100" :min="1" />
            <NButton type="primary" :loading="loading" @click="confirmPump">
              Pump
            </NButton>
          </NSpace>
        </NTabPane>
        <NTabPane name="shutdown" tab="Shutdown">
          <NAlert
            class="mb-4"
            :title="$t('page.aurora.panel.diagnostics.shutdownHelp')"
            type="error"
          />
          <div class="flex gap-2">
            <NInput
              v-model:value="shutdownPhrase"
              class="w-64"
              placeholder="SHUTDOWN"
            />
            <NButton type="error" @click="confirmShutdown">Shutdown</NButton>
          </div>
        </NTabPane>
        <NTabPane name="result" tab="Last result">
          <JsonView :value="lastResult" />
        </NTabPane>
      </NTabs>
    </NCard>
  </Page>
</template>
