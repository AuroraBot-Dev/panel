<script lang="ts" setup>
import type { AgentProfile, ConfigSnapshot } from '#/types/aurora';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { getAgentProfiles, getConfigSnapshot } from '#/api';
import JsonView from '#/components/aurora/json-view.vue';
import { $t } from '#/locales';

const profiles = ref<AgentProfile[]>([]);
const snapshot = ref<ConfigSnapshot>();
const loading = ref(false);
const error = ref('');
const sections = computed(() =>
  snapshot.value
    ? ['panel', 'console', 'engine', 'storage', 'models', 'sources']
    : [],
);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    [profiles.value, snapshot.value] = await Promise.all([
      getAgentProfiles(),
      getConfigSnapshot(),
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
    :description="$t('page.aurora.features.agentSettings.description')"
    :title="$t('page.aurora.features.agentSettings.title')"
  >
    <template #extra
      ><Button :loading="loading" @click="load">{{
        $t('page.aurora.panel.refresh')
      }}</Button></template
    >
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Card class="mb-4" title="Runtime profile">
      <Descriptions :column="2" bordered size="small">
        <Descriptions.Item label="Profile">{{
          snapshot?.profile
        }}</Descriptions.Item>
        <Descriptions.Item label="Sources">{{
          snapshot?.sources.length ?? 0
        }}</Descriptions.Item>
      </Descriptions>
    </Card>
    <Card>
      <Tabs>
        <Tabs.TabPane key="profiles" tab="Agent profiles">
          <Table
            :columns="[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              {
                title: 'Model role',
                dataIndex: 'model_role',
                key: 'model_role',
              },
              {
                title: 'Delegate',
                dataIndex: 'can_delegate',
                key: 'can_delegate',
              },
              {
                title: 'Child profiles',
                dataIndex: 'child_profiles',
                key: 'child_profiles',
              },
            ]"
            :data-source="profiles"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <Tag
                v-if="column.key === 'can_delegate'"
                :color="record.can_delegate ? 'green' : 'default'"
                >{{ record.can_delegate }}</Tag
              >
              <template v-if="column.key === 'child_profiles'">{{
                record.child_profiles.join(', ')
              }}</template>
            </template>
          </Table>
        </Tabs.TabPane>
        <Tabs.TabPane v-for="section in sections" :key="section" :tab="section">
          <JsonView :value="snapshot?.[section as keyof ConfigSnapshot]" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
