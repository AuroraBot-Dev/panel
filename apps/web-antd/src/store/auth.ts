import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

const OWNER_INFO: UserInfo = {
  avatar: preferences.app.defaultAvatar,
  desc: 'AuroraBot panel owner',
  homePath: '/overview',
  realName: 'Aurora Owner',
  roles: ['admin'],
  token: '',
  userId: 'panel-owner',
  username: 'owner',
};

const OWNER_ACCESS_CODES = ['panel:owner', 'panel:read', 'panel:write'];

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();
  const loginLoading = ref(false);

  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const session = await loginApi({
        token_login: String(params.token_login || '').trim(),
      });
      if (!session.token) return { userInfo };

      accessStore.setAccessToken(session.token);
      accessStore.setAccessTokenExpiresAt(session.expires_at);
      accessStore.setAccessCodes(OWNER_ACCESS_CODES);
      userInfo = { ...OWNER_INFO, token: session.token };
      userStore.setUserInfo(userInfo);

      if (accessStore.loginExpired) {
        accessStore.setLoginExpired(false);
      } else if (onSuccess) {
        await onSuccess();
      } else {
        await router.push(userInfo.homePath || preferences.app.defaultHomePath);
      }

      notification.success({
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo.realName}`,
        duration: 3,
        message: $t('authentication.loginSuccess'),
      });
    } finally {
      loginLoading.value = false;
    }
    return { userInfo };
  }

  async function logout(redirect = true) {
    if (accessStore.accessToken) {
      try {
        await logoutApi();
      } catch {
        // The local session must be removed even if the server is unavailable.
      }
    }
    resetAllStores();
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? { redirect: encodeURIComponent(router.currentRoute.value.fullPath) }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = {
      ...OWNER_INFO,
      token: accessStore.accessToken || '',
    };
    userStore.setUserInfo(userInfo);
    accessStore.setAccessCodes(OWNER_ACCESS_CODES);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return { $reset, authLogin, fetchUserInfo, loginLoading, logout };
});
