<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { ExtensionInfo } from '#/api';

import { computed, h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NAlert, NCard, NDataTable, NSpace, NSwitch, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { listExtensions, setExtensionEnabled } from '#/api';
import { $t } from '#/locales';

const extensions = ref<ExtensionInfo[]>([]);
const loading = ref(false);
const toggling = ref('');
const error = ref('');

const columns = computed<DataTableColumns<ExtensionInfo>>(() => [
  { key: 'id', title: 'ID', ellipsis: { tooltip: true } },
  { key: 'version', title: 'Version', width: 100 },
  {
    key: 'enabled',
    title: $t('page.aurora.panel.status'),
    width: 120,
    render: (row) =>
      h(
        NTag,
        { type: row.enabled ? 'success' : 'default' },
        {
          default: () =>
            row.enabled
              ? $t('page.aurora.panel.enabled')
              : $t('page.aurora.panel.disabled'),
        },
      ),
  },
  {
    key: 'factory',
    title: 'Factory',
    ellipsis: { tooltip: true },
  },
  {
    key: 'faces',
    title: 'Faces',
    render: (row) =>
      h(
        NSpace,
        { size: 4 },
        {
          default: () =>
            row.faces.map((face) =>
              h(NTag, { size: 'small', type: 'info' }, { default: () => face }),
            ),
        },
      ),
  },
  {
    key: 'capabilities',
    title: 'Capabilities',
    render: (row) =>
      row.capabilities.length > 0
        ? h(
            NSpace,
            { size: 4 },
            {
              default: () =>
                row.capabilities.map((capability) =>
                  h(
                    NTag,
                    { size: 'small', type: 'warning' },
                    { default: () => capability },
                  ),
                ),
            },
          )
        : h('span', { class: 'text-muted-foreground' }, '-'),
  },
  {
    key: 'actions',
    title: $t('page.aurora.panel.action'),
    width: 140,
    render: (row) =>
      h(NSwitch, {
        loading: toggling.value === row.id,
        value: row.enabled,
        'onUpdate:value': (value: boolean | number | string) =>
          confirmToggle(row, value === true),
      }),
  },
]);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    extensions.value = await listExtensions();
  } catch (loadError) {
    error.value = (loadError as Error).message;
  } finally {
    loading.value = false;
  }
}

function confirmToggle(extension: ExtensionInfo, enabled: boolean) {
  dialog.warning({
    content: $t('page.aurora.panel.extensions.toggleHelp'),
    title: `${extension.id} → ${enabled ? 'enabled' : 'disabled'}`,
    async onPositiveClick() {
      toggling.value = extension.id;
      try {
        const result = await setExtensionEnabled(extension.id, enabled);
        extension.enabled = result.enabled;
        message.success($t('page.aurora.panel.extensions.toggleDone'));
      } catch (toggleError) {
        message.error((toggleError as Error).message);
      } finally {
        toggling.value = '';
      }
    },
  });
}

onMounted(load);
</script>

<template>
  <Page>
    <NAlert v-if="error" class="mb-4" :title="error" type="error" />
    <NAlert
      class="mb-4"
      :title="$t('page.aurora.panel.extensions.restartHint')"
      type="info"
    />
    <NCard>
      <NDataTable
        :columns="columns"
        :data="extensions"
        :loading="loading"
        :pagination="false"
        size="small"
      />
    </NCard>
  </Page>
</template>
