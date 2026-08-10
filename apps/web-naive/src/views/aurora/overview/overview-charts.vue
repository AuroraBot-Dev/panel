<script lang="ts" setup>
import type { AiCost, TaskTransport } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { preferences } from '@vben/preferences';

import { $t } from '#/locales';

const props = defineProps<{
  cost?: AiCost;
  kind: 'cost' | 'tasks';
  tasks: TaskTransport[];
}>();

const chartRef = ref();
const { renderEcharts } = useEcharts(chartRef);
type ChartOption = Parameters<typeof renderEcharts>[0];

const taskStatusData = computed(() => {
  const counts = new Map<string, number>();
  props.tasks.forEach((task) =>
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1),
  );
  return [...counts].map(([name, value]) => ({ name, value }));
});

const costData = computed(() =>
  Object.entries(props.cost?.by_role ?? {}).map(([name, value]) => ({
    name,
    value,
  })),
);

function chartOptions(): ChartOption {
  if (props.kind === 'tasks') {
    return {
      color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#8c8c8c'],
      legend: { bottom: 0, textStyle: { color: '#64748b' } },
      series: [
        {
          data: taskStatusData.value,
          label: { formatter: '{b}\n{c}' },
          radius: ['42%', '68%'],
          type: 'pie',
        },
      ],
      title:
        taskStatusData.value.length > 0
          ? undefined
          : {
              left: 'center',
              text: $t('page.aurora.panel.overview.noTasks'),
              top: 'middle',
            },
      tooltip: { trigger: 'item' },
    };
  }

  return {
    color: ['#13c2c2'],
    grid: { bottom: 30, containLabel: true, left: 15, right: 25, top: 20 },
    series: [
      {
        barMaxWidth: 28,
        data: costData.value.map((item) => item.value),
        type: 'bar',
      },
    ],
    title:
      costData.value.length > 0
        ? undefined
        : {
            left: 'center',
            text: $t('page.aurora.panel.overview.noCost'),
            top: 'middle',
          },
    tooltip: { trigger: 'axis' },
    xAxis: {
      axisLabel: { color: '#64748b', interval: 0, rotate: 20 },
      data: costData.value.map((item) => item.name),
      type: 'category',
    },
    yAxis: {
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      type: 'value',
    },
  };
}

function render() {
  void renderEcharts(chartOptions());
}

watch(() => [props.tasks, props.cost, preferences.theme.mode], render, {
  deep: true,
});
onMounted(render);
</script>

<template>
  <EchartsUI ref="chartRef" class="h-72" />
</template>
