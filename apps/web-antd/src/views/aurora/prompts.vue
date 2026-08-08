<script lang="ts" setup>
import type { AgentProfile, JsonRecord, PromptRecord } from '#/types/aurora';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, Card, Input, Select, Space } from 'ant-design-vue';

import { getAgentProfiles, getAiRoles, getPrompt } from '#/api';
import { $t } from '#/locales';

const profiles = ref<AgentProfile[]>([]);
const aiRoles = ref<JsonRecord[]>([]);
const selectedRole = ref('soul');
const prompt = ref<PromptRecord>();
const loading = ref(false);
const error = ref('');
const options = computed(() => {
  const values = new Set(['soul', 'world']);
  profiles.value.forEach((item) => {
    values.add(item.id);
    values.add(item.model_role);
  });
  aiRoles.value.forEach((item) => {
    const candidate = item.id ?? item.role ?? item.name;
    if (typeof candidate === 'string') values.add(candidate);
  });
  return [...values].sort().map((value) => ({ label: value, value }));
});

async function load() {
  if (!selectedRole.value.trim()) return;
  loading.value = true;
  error.value = '';
  try {
    prompt.value = await getPrompt(selectedRole.value.trim());
  } catch (loadError) {
    prompt.value = undefined;
    error.value = (loadError as Error).message;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  [profiles.value, aiRoles.value] = await Promise.all([
    getAgentProfiles(),
    getAiRoles(),
  ]);
  await load();
});
</script>

<template>
  <Page
    :description="$t('page.aurora.features.prompts.description')"
    :title="$t('page.aurora.features.prompts.title')"
  >
    <Card>
      <Space.Compact class="mb-4 w-full max-w-3xl">
        <Select
          v-model:value="selectedRole"
          class="min-w-56"
          :options="options"
          show-search
        />
        <Input
          v-model:value="selectedRole"
          placeholder="soul / world / profile_id"
          @press-enter="load"
        />
        <Button type="primary" :loading="loading" @click="load">{{
          $t('page.aurora.panel.apply')
        }}</Button>
      </Space.Compact>
      <Alert
        v-if="error"
        class="mb-4"
        :message="error"
        show-icon
        type="error"
      />
      <Input.TextArea
        :value="prompt?.text ?? ''"
        :auto-size="{ minRows: 18, maxRows: 35 }"
        readonly
      />
    </Card>
  </Page>
</template>
