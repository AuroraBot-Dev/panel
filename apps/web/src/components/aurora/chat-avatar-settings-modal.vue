<script lang="ts" setup>
import { computed, ref } from 'vue';
import { VueCropper } from 'vue-cropper';

import { IconifyIcon } from '@vben/icons';

import {
  NAvatar,
  NButton,
  NCard,
  NInput,
  NModal,
  NSpace,
  NText,
} from 'naive-ui';

import { useChatAvatarStore } from '#/store';

const show = defineModel<boolean>('show', { required: true });

const chatAvatar = useChatAvatarStore();

const botFileInput = ref<HTMLInputElement>();
const userFileInput = ref<HTMLInputElement>();
const cropperRef = ref();
const cropImage = ref('');
const cropTarget = ref<'bot' | 'user' | null>(null);
const showCrop = computed(() => cropTarget.value !== null);

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

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', () => reject(new Error('读取图片失败')));
    reader.addEventListener('load', () => {
      resolve(String(reader.result));
    });
    reader.readAsDataURL(file);
  });
}

async function openCrop(target: 'bot' | 'user', file: File) {
  cropImage.value = await readAsDataURL(file);
  cropTarget.value = target;
}

async function handleBotUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    await openCrop('bot', file);
  } finally {
    input.value = '';
  }
}

async function handleUserUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    await openCrop('user', file);
  } finally {
    input.value = '';
  }
}

function confirmCrop() {
  cropperRef.value?.getCropData((data: string) => {
    if (cropTarget.value === 'bot') {
      chatAvatar.botUrl = data;
    } else if (cropTarget.value === 'user') {
      chatAvatar.userUrl = data;
    }
    cropTarget.value = null;
  });
}

function cancelCrop() {
  cropTarget.value = null;
  cropImage.value = '';
}

function triggerBotUpload() {
  botFileInput.value?.click();
}

function triggerUserUpload() {
  userFileInput.value?.click();
}
</script>

<template>
  <NModal
    :show="show"
    closable
    preset="card"
    style="width: 640px"
    :mask-closable="true"
    :title="
      showCrop
        ? cropTarget === 'bot'
          ? '裁剪 Bot 头像'
          : '裁剪用户头像'
        : '聊天头像设置'
    "
    @update:show="(value: boolean) => (show = value)"
  >
    <template v-if="!showCrop">
      <div class="space-y-4">
        <NCard title="Bot 头像" :bordered="false">
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

        <NCard title="用户头像" :bordered="false">
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
    </template>
    <template v-else>
      <div :key="cropTarget ?? 'none'" class="cropper-wrap">
        <VueCropper
          ref="cropperRef"
          :img="cropImage"
          :output-size="256"
          output-type="png"
          :auto-crop="true"
          :fixed="true"
          :fixed-number="[1, 1]"
          :fixed-box="false"
          :full="false"
          :center="true"
          :info="true"
        />
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <NButton @click="cancelCrop">取消</NButton>
        <NButton type="primary" @click="confirmCrop">确定</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.cropper-wrap {
  height: 360px;
}
</style>
