<script lang="ts" setup>
import type { AgentProfile, JsonRecord, PromptRecord } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NAlert, NButton, NCard, NInput, NSelect } from 'naive-ui';

import { message } from '#/adapter/naive';
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
  return [...values].toSorted().map((value) => ({ label: value, value }));
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

async function copyPrompt() {
  if (!prompt.value?.text) return;
  await navigator.clipboard.writeText(prompt.value.text);
  message.success($t('page.aurora.panel.prompts.copied'));
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
    <NCard>
      <div class="mb-4 flex w-full max-w-3xl gap-2">
        <NSelect
          v-model:value="selectedRole"
          class="min-w-56"
          :options="options"
          filterable
        />
        <NInput
          v-model:value="selectedRole"
          placeholder="soul / world / profile_id"
          @keydown.enter="load"
        />
        <NButton type="primary" :loading="loading" @click="load">
          {{ $t('page.aurora.panel.apply') }}
        </NButton>
      </div>
      <NAlert v-if="error" class="mb-4" :title="error" type="error" />
      <div class="mb-2 flex justify-end">
        <NButton size="small" :disabled="!prompt?.text" @click="copyPrompt">
          {{ $t('page.aurora.panel.prompts.copy') }}
        </NButton>
      </div>
      <NInput
        type="textarea"
        :value="prompt?.text ?? ''"
        :autosize="{ minRows: 18, maxRows: 35 }"
        readonly
      />
    </NCard>
  </Page>
</template>
