<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { AppInfo, ExtensionInfo, JsonRecord } from '#/api';

import { computed, h } from 'vue';

import {
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NSpace,
  NTag,
} from 'naive-ui';

import { $t } from '#/locales';

const props = defineProps<{
  section: string;
  value: unknown;
}>();

const json = computed(() => props.value as JsonRecord);

const extensionColumns: DataTableColumns<ExtensionInfo> = [
  { key: 'id', title: 'ID' },
  { key: 'version', title: 'Version', width: 90 },
  {
    key: 'enabled',
    title: $t('page.aurora.panel.status'),
    width: 100,
    render: (row) =>
      h(
        NTag,
        { type: row.enabled ? 'success' : 'default' },
        { default: () => (row.enabled ? 'enabled' : 'disabled') },
      ),
  },
  {
    key: 'faces',
    title: 'Faces',
    render: (row) =>
      h(
        NSpace,
        { size: 4 },
        {
          default: () =>
            row.faces.map((face) =>
              h(NTag, { size: 'small', type: 'info' }, { default: () => face }),
            ),
        },
      ),
  },
  {
    key: 'capabilities',
    title: 'Capabilities',
    ellipsis: { tooltip: true },
  },
];

const appColumns: DataTableColumns<AppInfo> = [
  { key: 'package', title: 'Package' },
  {
    key: 'enabled',
    title: $t('page.aurora.panel.status'),
    width: 100,
    render: (row) =>
      h(
        NTag,
        { type: row.enabled ? 'success' : 'default' },
        { default: () => (row.enabled ? 'enabled' : 'disabled') },
      ),
  },
  { key: 'transport', title: 'Transport', width: 130 },
  { key: 'working_dir', title: 'Working dir', ellipsis: { tooltip: true } },
  { key: 'command', title: 'Command', ellipsis: { tooltip: true } },
];

const sourceColumns: DataTableColumns<JsonRecord> = [
  { key: 'path', title: 'Path' },
  { key: 'sha256', title: 'SHA256', ellipsis: { tooltip: true } },
];

const definitionColumns: DataTableColumns<JsonRecord> = [
  { key: 'role', title: 'Role' },
  { key: 'provider', title: 'Provider' },
  { key: 'model', title: 'Model' },
];

const providerColumns: DataTableColumns<JsonRecord> = [
  { key: 'id', title: 'ID' },
  { key: 'adapter', title: 'Adapter' },
  { key: 'base_url', title: 'Base URL' },
];

function definitionsRows(value: unknown): JsonRecord[] {
  const definitions =
    (value as Record<string, { model: string; provider: string }>) ?? {};
  return Object.entries(definitions).map(([role, item]) => ({
    role,
    provider: item.provider,
    model: item.model,
  }));
}

function providersRows(value: unknown): JsonRecord[] {
  const providers =
    (value as Record<string, { adapter: string; base_url: string }>) ?? {};
  return Object.entries(providers).map(([id, item]) => ({
    id,
    adapter: item.adapter,
    base_url: item.base_url ?? '-',
  }));
}

function rolesTags(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function originsTags(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function budgetEntries(value: unknown, label: string) {
  const budget = (value as Record<string, number>) ?? {};
  return [
    { key: `${label}.max_model_calls`, value: budget.max_model_calls },
    { key: `${label}.max_tool_calls`, value: budget.max_tool_calls },
    {
      key: `${label}.max_duration_seconds`,
      value: budget.max_duration_seconds,
    },
  ];
}
</script>

<template>
  <div>
    <template v-if="section === 'panel'">
      <NDescriptions :column="2" bordered size="small">
        <NDescriptionsItem label="Enabled">
          {{ (json as JsonRecord).enabled }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Host">
          {{ (json as JsonRecord).host }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Port">
          {{ (json as JsonRecord).port }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Open browser">
          {{ (json as JsonRecord).open_browser }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Session TTL">
          {{ (json as JsonRecord).session_ttl_seconds }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Max upload bytes">
          {{ (json as JsonRecord).max_upload_bytes }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Allowed origins" :span="2">
          <NSpace :size="4" wrap>
            <NTag
              v-for="origin in originsTags(
                (json as JsonRecord).allowed_origins,
              )"
              :key="origin"
              size="small"
            >
              {{ origin }}
            </NTag>
          </NSpace>
        </NDescriptionsItem>
      </NDescriptions>
    </template>

    <template v-else-if="section === 'console'">
      <NDescriptions :column="2" bordered size="small">
        <NDescriptionsItem label="Enabled">
          {{ (json as JsonRecord).enabled }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Terminal logs">
          {{ (json as JsonRecord).terminal_logs }}
        </NDescriptionsItem>
      </NDescriptions>
    </template>

    <template v-else-if="section === 'engine'">
      <NDescriptions :column="2" bordered size="small">
        <NDescriptionsItem label="Workspace">
          {{ (json as JsonRecord).workspace }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Triage role">
          {{ ((json as JsonRecord).triage as JsonRecord)?.model_role }}
        </NDescriptionsItem>
        <NDescriptionsItem
          v-for="item in budgetEntries(
            (json as JsonRecord).interactive_budget,
            'interactive',
          )"
          :key="item.key"
          :label="item.key"
        >
          {{ item.value }}
        </NDescriptionsItem>
        <NDescriptionsItem
          v-for="item in budgetEntries(
            (json as JsonRecord).autonomous_budget,
            'autonomous',
          )"
          :key="item.key"
          :label="item.key"
        >
          {{ item.value }}
        </NDescriptionsItem>
      </NDescriptions>
    </template>

    <template v-else-if="section === 'storage'">
      <NDescriptions :column="2" bordered size="small">
        <NDescriptionsItem
          v-for="(item, key) in json as JsonRecord"
          :key="key"
          :label="key"
        >
          {{ item }}
        </NDescriptionsItem>
      </NDescriptions>
    </template>

    <template v-else-if="section === 'models'">
      <NDescriptions :column="1" bordered size="small">
        <NDescriptionsItem label="Roles">
          <NSpace :size="4" wrap>
            <NTag
              v-for="role in rolesTags((json as JsonRecord).roles)"
              :key="role"
              size="small"
              type="info"
            >
              {{ role }}
            </NTag>
          </NSpace>
        </NDescriptionsItem>
      </NDescriptions>
      <h4 class="mt-4 mb-2 font-semibold">Definitions</h4>
      <NDataTable
        :columns="definitionColumns"
        :data="definitionsRows((json as JsonRecord).definitions)"
        size="small"
      />
      <h4 class="mt-4 mb-2 font-semibold">Providers</h4>
      <NDataTable
        :columns="providerColumns"
        :data="providersRows((json as JsonRecord).providers)"
        size="small"
      />
    </template>

    <template v-else-if="section === 'sources'">
      <NDataTable
        :columns="sourceColumns"
        :data="props.value as JsonRecord[]"
        size="small"
      />
    </template>

    <template v-else-if="section === 'extensions'">
      <NDataTable
        :columns="extensionColumns"
        :data="props.value as ExtensionInfo[]"
        size="small"
      />
    </template>

    <template v-else-if="section === 'apps'">
      <NDataTable
        :columns="appColumns"
        :data="props.value as AppInfo[]"
        size="small"
      />
    </template>

    <template v-else>
      <pre class="config-json">{{ JSON.stringify(props.value, null, 2) }}</pre>
    </template>
  </div>
</template>

<style scoped>
.config-json {
  max-height: 60vh;
  padding: 12px;
  overflow: auto;
  font-size: 12px;
  background: hsl(var(--muted));
  border-radius: 6px;
}
</style>
