<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NAvatar, NButton, NCard, NInput, NSpace, NText } from 'naive-ui';

import { useChatAvatarStore } from '#/store';

const chatAvatar = useChatAvatarStore();

const botFileInput = ref<HTMLInputElement>();
const userFileInput = ref<HTMLInputElement>();

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

function cropToSquare(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', () => reject(new Error('读取图片失败')));
    reader.addEventListener('load', () => {
      const image = new Image();
      image.addEventListener('error', () => reject(new Error('图片解析失败')));
      image.addEventListener('load', () => {
        const side = Math.min(image.width, image.height);
        const sourceX = (image.width - side) / 2;
        const sourceY = (image.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('无法创建画布'));
          return;
        }
        context.drawImage(
          image,
          sourceX,
          sourceY,
          side,
          side,
          0,
          0,
          size,
          size,
        );
        resolve(canvas.toDataURL('image/png'));
      });
      image.src = String(reader.result);
    });
    reader.readAsDataURL(file);
  });
}

async function handleBotUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    chatAvatar.botUrl = await cropToSquare(file);
  } finally {
    input.value = '';
  }
}

async function handleUserUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    chatAvatar.userUrl = await cropToSquare(file);
  } finally {
    input.value = '';
  }
}

function triggerBotUpload() {
  botFileInput.value?.click();
}

function triggerUserUpload() {
  userFileInput.value?.click();
}
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
          <NButton @click="triggerBotUpload">上传图片</NButton>
          <NButton
            :disabled="!chatAvatar.botUrl"
            @click="chatAvatar.botUrl = ''"
          >
            清除图片
          </NButton>
          <input
            ref="botFileInput"
            class="hidden"
            type="file"
            accept="image/*"
            @change="handleBotUpload"
          />
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
          <NButton @click="triggerUserUpload">上传图片</NButton>
          <NButton
            :disabled="!chatAvatar.userUrl"
            @click="chatAvatar.userUrl = ''"
          >
            清除图片
          </NButton>
          <input
            ref="userFileInput"
            class="hidden"
            type="file"
            accept="image/*"
            @change="handleUserUpload"
          />
        </NSpace>
      </NCard>

      <NText depth="3">
        头像设置会保存在本地浏览器，仅用于聊天界面展示。
      </NText>
    </div>
  </Page>
</template>
