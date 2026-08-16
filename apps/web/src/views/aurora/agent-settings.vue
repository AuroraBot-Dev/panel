<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { AgentProfile, ConfigSnapshot } from '#/api';

import { computed, h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NTabPane,
  NTabs,
  NTag,
} from 'naive-ui';

import { getAgentProfiles, getConfigSnapshot } from '#/api';
import ConfigSection from '#/components/aurora/config-section.vue';
import { $t } from '#/locales';

const profiles = ref<AgentProfile[]>([]);
const snapshot = ref<ConfigSnapshot>();
const loading = ref(false);
const error = ref('');
const sections = computed(() =>
  snapshot.value
    ? [
        'panel',
        'console',
        'engine',
        'storage',
        'models',
        'sources',
        'extensions',
        'apps',
      ]
    : [],
);

const profileColumns: DataTableColumns<AgentProfile> = [
  { key: 'id', title: 'ID' },
  { key: 'model_role', title: 'Model role' },
  {
    key: 'can_delegate',
    title: 'Delegate',
    render: (row) =>
      h(
        NTag,
        { type: row.can_delegate ? 'success' : 'default' },
        { default: () => String(row.can_delegate) },
      ),
  },
  {
    key: 'child_profiles',
    title: 'Child profiles',
    render: (row) => row.child_profiles.join(', '),
  },
];

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
  <Page>
    <template #extra>
      <NButton :loading="loading" @click="load">
        {{ $t('page.aurora.panel.refresh') }}
      </NButton>
    </template>
    <NAlert v-if="error" class="mb-4" :title="error" type="error" />
    <NCard class="mb-4" title="Runtime profile">
      <NDescriptions :column="2" bordered size="small">
        <NDescriptionsItem label="Profile">
          {{ snapshot?.profile }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Sources">
          {{ snapshot?.sources.length ?? 0 }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>
    <NCard>
      <NTabs>
        <NTabPane name="profiles" tab="Agent profiles">
          <NDataTable :columns="profileColumns" :data="profiles" size="small" />
        </NTabPane>
        <NTabPane
          v-for="section in sections"
          :key="section"
          :name="section"
          :tab="section"
        >
          <ConfigSection
            :section="section"
            :value="snapshot?.[section as keyof ConfigSnapshot]"
          />
        </NTabPane>
      </NTabs>
    </NCard>
  </Page>
</template>
