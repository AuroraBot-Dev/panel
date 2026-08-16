<script lang="ts" setup>
import { computed, watch } from 'vue';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BasicLayout, LockScreen, UserDropdown } from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { $t } from '#/locales';
import { router } from '#/router';
import { useAuthStore, useChatAvatarStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const chatAvatar = useChatAvatarStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

const avatar = computed(
  () =>
    chatAvatar.userUrl ||
    userStore.userInfo?.avatar ||
    preferences.app.defaultAvatar,
);

const userMenus = [
  {
    handler: () => router.push('/settings/chat-avatars'),
    icon: 'lucide:smile',
    text: $t('page.aurora.features.chatAvatars.title'),
  },
];

async function handleLogout() {
  await authStore.logout(false);
}

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content, isDark: dark }) => {
    if (!enable) {
      destroyWatermark();
      return;
    }
    await updateWatermark({
      advancedStyle: {
        colorStops: [
          {
            color: dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.10)',
            offset: 0,
          },
        ],
        type: 'linear',
      },
      content: content || userStore.userInfo?.username || 'AuroraBot',
    });
  },
  { immediate: true },
);
</script>

<template>
  <BasicLayout
    :avatar
    :text="userStore.userInfo?.realName"
    @clear-preferences-and-logout="handleLogout"
    @logout="handleLogout"
  >
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus="userMenus"
        :text="userStore.userInfo?.realName"
        description="AuroraBot Operator"
        tag-text="Agent"
        @clear-preferences-and-logout="handleLogout"
        @logout="handleLogout"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
