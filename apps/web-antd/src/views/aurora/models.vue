<script lang="ts" setup>
import type { AiCost, JsonRecord } from '#/types/aurora';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, Card, Statistic, Table, Tabs } from 'ant-design-vue';

import { getAiCost, getAiModels, getAiRoles } from '#/api';
import { $t } from '#/locales';

const models = ref<JsonRecord[]>([]);
const roles = ref<JsonRecord[]>([]);
const cost = ref<AiCost>();
const loading = ref(false);
const error = ref('');

function rows(value?: Record<string, number>) {
  return Object.entries(value ?? {}).map(([name, amount]) => ({
    amount,
    name,
  }));
}

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
  <Page
    :description="$t('page.aurora.features.models.description')"
    :title="$t('page.aurora.features.models.title')"
  >
    <template #extra
      ><Button :loading="loading" @click="load">{{
        $t('page.aurora.panel.refresh')
      }}</Button></template
    >
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Card class="mb-4"
      ><Statistic
        :precision="6"
        prefix="$"
        title="Total cost"
        :value="cost?.total_cost ?? 0"
    /></Card>
    <Card>
      <Tabs>
        <Tabs.TabPane key="models" tab="Models">
          <Table
            :columns="
              Object.keys(models[0] ?? {}).map((key) => ({
                title: key,
                dataIndex: key,
                key,
              }))
            "
            :data-source="models"
            :loading="loading"
            size="small"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="roles" tab="Roles">
          <Table
            :columns="
              Object.keys(roles[0] ?? {}).map((key) => ({
                title: key,
                dataIndex: key,
                key,
              }))
            "
            :data-source="roles"
            :loading="loading"
            size="small"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="byRole" tab="Cost by role">
          <Table
            :columns="[
              { title: 'Role', dataIndex: 'name' },
              { title: 'Cost', dataIndex: 'amount' },
            ]"
            :data-source="rows(cost?.by_role)"
            size="small"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="byModel" tab="Cost by model">
          <Table
            :columns="[
              { title: 'Model', dataIndex: 'name' },
              { title: 'Cost', dataIndex: 'amount' },
            ]"
            :data-source="rows(cost?.by_model)"
            size="small"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="byStatus" tab="Cost by status">
          <Table
            :columns="[
              { title: 'Status', dataIndex: 'name' },
              { title: 'Cost', dataIndex: 'amount' },
            ]"
            :data-source="rows(cost?.by_status)"
            size="small"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
