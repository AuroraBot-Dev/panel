<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { AppInfo } from '#/api';

import { computed, h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NAlert, NCard, NDataTable, NSwitch, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { listApps, setAppEnabled } from '#/api';
import { $t } from '#/locales';

const apps = ref<AppInfo[]>([]);
const loading = ref(false);
const toggling = ref('');
const error = ref('');

const columns = computed<DataTableColumns<AppInfo>>(() => [
  { key: 'package', title: 'Package', ellipsis: { tooltip: true } },
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
  { key: 'transport', title: 'Transport', width: 140 },
  { key: 'working_dir', title: 'Working dir', ellipsis: { tooltip: true } },
  {
    key: 'command',
    title: 'Command',
    render: (row) => row.command.join(' '),
    ellipsis: { tooltip: true },
  },
  {
    key: 'url',
    title: 'URL',
    render: (row) => row.url ?? '-',
    ellipsis: { tooltip: true },
  },
  {
    key: 'timeout_seconds',
    title: 'Timeout',
    width: 100,
    render: (row) => `${row.timeout_seconds}s`,
  },
  {
    key: 'actions',
    title: $t('page.aurora.panel.action'),
    width: 140,
    render: (row) =>
      h(NSwitch, {
        loading: toggling.value === row.package,
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
    apps.value = await listApps();
  } catch (loadError) {
    error.value = (loadError as Error).message;
  } finally {
    loading.value = false;
  }
}

function confirmToggle(app: AppInfo, enabled: boolean) {
  dialog.warning({
    content: $t('page.aurora.panel.apps.toggleHelp'),
    title: `${app.package} → ${enabled ? 'enabled' : 'disabled'}`,
    async onPositiveClick() {
      toggling.value = app.package;
      try {
        const result = await setAppEnabled(app.package, enabled);
        app.enabled = result.enabled;
        message.success($t('page.aurora.panel.apps.toggleDone'));
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
      :title="$t('page.aurora.panel.apps.restartHint')"
      type="info"
    />
    <NCard>
      <NDataTable
        :columns="columns"
        :data="apps"
        :loading="loading"
        :pagination="false"
        size="small"
      />
    </NCard>
  </Page>
</template>
