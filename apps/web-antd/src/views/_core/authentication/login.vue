<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';

import { Alert, Tag } from 'ant-design-vue';

import { getApiHealth } from '#/api';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const healthLoading = ref(true);
const healthProfile = ref('');
const backendOnline = ref(false);

const formSchema = computed((): VbenFormSchema[] => [
  {
    component: 'VbenInputPassword',
    componentProps: {
      autocomplete: 'current-password',
      placeholder: $t('page.aurora.panel.auth.tokenPlaceholder'),
    },
    fieldName: 'token_login',
    label: $t('page.aurora.panel.auth.token'),
    rules: z
      .string()
      .trim()
      .min(1, { message: $t('page.aurora.panel.auth.tokenRequired') }),
  },
]);

onMounted(async () => {
  try {
    const health = await getApiHealth();
    backendOnline.value = health.ok;
    healthProfile.value = health.profile;
  } catch {
    backendOnline.value = false;
  } finally {
    healthLoading.value = false;
  }
});
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-code-login="false"
    :show-forget-password="false"
    :show-remember-me="false"
    :show-qrcode-login="false"
    :show-register="false"
    :show-third-party-login="false"
    @submit="authStore.authLogin"
  >
    <template #subTitle>
      <div class="space-y-3">
        <div>{{ $t('page.aurora.panel.auth.help') }}</div>
        <Alert
          :message="
            backendOnline
              ? $t('page.aurora.panel.auth.online')
              : $t('page.aurora.panel.auth.offline')
          "
          :show-icon="true"
          :type="backendOnline ? 'success' : 'warning'"
        >
          <template v-if="healthLoading" #description>
            {{ $t('page.aurora.panel.loading') }}
          </template>
          <template v-else-if="healthProfile" #description>
            <Tag>{{ healthProfile }}</Tag>
          </template>
        </Alert>
      </div>
    </template>
  </AuthenticationLogin>
</template>
