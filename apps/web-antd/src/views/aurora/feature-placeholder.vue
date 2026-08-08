<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Alert, Card, Descriptions, Tag } from 'ant-design-vue';

import { $t } from '#/locales';

const props = defineProps<{ featureKey: string }>();

const prefix = computed(() => `page.aurora.features.${props.featureKey}`);
const details = computed(() => [
  {
    key: 'api',
    label: $t('page.aurora.placeholder.boundary'),
    children: $t(`${prefix.value}.api`),
  },
  {
    key: 'state',
    label: $t('page.aurora.placeholder.state'),
    children: $t('page.aurora.placeholder.stateValue'),
  },
]);
</script>

<template>
  <Page
    :description="$t(`${prefix}.description`)"
    :title="$t(`${prefix}.title`)"
  >
    <template #extra>
      <Tag color="orange">{{ $t('page.aurora.placeholder.badge') }}</Tag>
    </template>

    <Card class="max-w-4xl" :title="$t(`${prefix}.title`)" bordered>
      <Descriptions :column="1" :items="details" bordered size="middle" />

      <p class="text-muted-foreground my-5 leading-7">
        {{ $t('page.aurora.placeholder.description') }}
      </p>

      <Alert :message="$t('page.aurora.placeholder.notice')" show-icon>
        <template #icon>
          <IconifyIcon icon="lucide:shield-check" />
        </template>
      </Alert>
    </Card>
  </Page>
</template>
