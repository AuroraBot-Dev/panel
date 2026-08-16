<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { AiCost, JsonRecord } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NStatistic,
  NTabPane,
  NTabs,
} from 'naive-ui';

import { getAiCost, getAiModels, getAiRoles } from '#/api';
import { $t } from '#/locales';

interface CostRow {
  amount: number;
  name: string;
}

const models = ref<JsonRecord[]>([]);
const roles = ref<JsonRecord[]>([]);
const cost = ref<AiCost>();
const loading = ref(false);
const error = ref('');

function rows(value?: Record<string, number>): CostRow[] {
  return Object.entries(value ?? {}).map(([name, amount]) => ({
    amount,
    name,
  }));
}

function keyColumns(row: JsonRecord): DataTableColumns<JsonRecord> {
  return Object.keys(row ?? {}).map((key) => ({
    key,
    title: key,
  }));
}

const costColumns: DataTableColumns<CostRow> = [
  { key: 'name', title: 'Role' },
  { key: 'amount', title: 'Cost' },
];

async function load() {
  loading.value = true;
  error.value = '';
  try {
    [models.value, roles.value, cost.value] = await Promise.all([
      getAiModels(),
      getAiRoles(),
      getAiCost(),
    ]);
  } catch (loadError) {
    error.value = (loadError as Error).message;
  } finally {
    loading.value = false;
  }
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
    <NAlert v-if="error" class="mb-4" :title="error" type="error" />
    <NCard class="mb-4">
      <NStatistic
        label="Total cost"
        :precision="6"
        :value="cost?.total_cost ?? 0"
      >
        <template #prefix>$</template>
      </NStatistic>
    </NCard>
    <NCard>
      <NTabs>
        <NTabPane name="models" tab="Models">
          <NDataTable
            :columns="keyColumns(models[0] ?? {})"
            :data="models"
            :loading="loading"
            size="small"
          />
        </NTabPane>
        <NTabPane name="roles" tab="Roles">
          <NDataTable
            :columns="keyColumns(roles[0] ?? {})"
            :data="roles"
            :loading="loading"
            size="small"
          />
        </NTabPane>
        <NTabPane name="byRole" tab="Cost by role">
          <NDataTable
            :columns="costColumns"
            :data="rows(cost?.by_role)"
            size="small"
          />
        </NTabPane>
        <NTabPane name="byModel" tab="Cost by model">
          <NDataTable
            :columns="costColumns"
            :data="rows(cost?.by_model)"
            size="small"
          />
        </NTabPane>
        <NTabPane name="byStatus" tab="Cost by status">
          <NDataTable
            :columns="costColumns"
            :data="rows(cost?.by_status)"
            size="small"
          />
        </NTabPane>
      </NTabs>
    </NCard>
  </Page>
</template>
