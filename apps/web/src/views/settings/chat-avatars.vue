<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NAvatar, NButton, NCard, NInput, NSpace, NText } from 'naive-ui';

import { useChatAvatarStore } from '#/store';

const chatAvatar = useChatAvatarStore();

const botPresets = [
  'lucide:bot',
  'lucide:cat',
  'lucide:dog',
  'lucide:rocket',
  'lucide:sparkles',
  'lucide:brain-circuit',
];

const userPresets = [
  'lucide:user',
  'lucide:smile',
  'lucide:ghost',
  'lucide:heart',
  'lucide:star',
  'lucide:flame',
];
</script>

<template>
  <Page>
    <div class="space-y-4">
      <NCard title="Bot 头像">
        <div class="mb-4 flex items-center gap-4">
          <NAvatar :size="56" round :src="chatAvatar.botUrl || undefined">
            <IconifyIcon :icon="chatAvatar.botIcon" class="size-7" />
          </NAvatar>
          <div class="flex-1 space-y-2">
            <NInput
              v-model:value="chatAvatar.botIcon"
              placeholder="图标名，如 lucide:bot"
            />
            <NInput
              v-model:value="chatAvatar.botUrl"
              placeholder="图片 URL（可选，优先于图标）"
            />
          </div>
        </div>
        <NSpace>
          <NButton
            v-for="icon in botPresets"
            :key="icon"
            :type="chatAvatar.botIcon === icon ? 'primary' : 'default'"
            circle
            @click="chatAvatar.botIcon = icon"
          >
            <template #icon>
              <IconifyIcon :icon="icon" class="size-5" />
            </template>
          </NButton>
        </NSpace>
      </NCard>

      <NCard title="用户头像">
        <div class="mb-4 flex items-center gap-4">
          <NAvatar :size="56" round :src="chatAvatar.userUrl || undefined">
            <IconifyIcon :icon="chatAvatar.userIcon" class="size-7" />
          </NAvatar>
          <div class="flex-1 space-y-2">
            <NInput
              v-model:value="chatAvatar.userIcon"
              placeholder="图标名，如 lucide:user"
            />
            <NInput
              v-model:value="chatAvatar.userUrl"
              placeholder="图片 URL（可选，优先于图标）"
            />
          </div>
        </div>
        <NSpace>
          <NButton
            v-for="icon in userPresets"
            :key="icon"
            :type="chatAvatar.userIcon === icon ? 'primary' : 'default'"
            circle
            @click="chatAvatar.userIcon = icon"
          >
            <template #icon>
              <IconifyIcon :icon="icon" class="size-5" />
            </template>
          </NButton>
        </NSpace>
      </NCard>

      <NText depth="3">
        头像设置会保存在本地浏览器，仅用于聊天界面展示。
      </NText>
    </div>
  </Page>
</template>
