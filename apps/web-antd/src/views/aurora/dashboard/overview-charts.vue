<script lang="ts" setup>
import type { AiCost, TaskTransport } from '#/types/aurora';

import type { DashboardSampleData } from './dashboard-data';

import { computed, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { preferences } from '@vben/preferences';

import { $t } from '#/locales';

const props = defineProps<{
  cost?: AiCost;
  kind: 'activity' | 'cost' | 'tasks' | 'tokens';
  sample: DashboardSampleData;
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

function axisStyle() {
  return {
    axisLabel: { color: '#64748b' },
    axisLine: { lineStyle: { color: '#94a3b8' } },
    splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
  };
}

function chartOptions(): ChartOption {
  const labels = props.sample.trend.map((point) => point.label);

  if (props.kind === 'tokens') {
    const inputLabel = $t('page.aurora.dashboard.input');
    const outputLabel = $t('page.aurora.dashboard.output');
    return {
      color: ['#722ed1', '#fa8c16'],
      grid: {
        bottom: 24,
        containLabel: true,
        left: 18,
        right: 18,
        top: 48,
      },
      legend: {
        data: [inputLabel, outputLabel],
        left: 'center',
        orient: 'horizontal',
        textStyle: { color: '#64748b' },
        top: 4,
      },
      series: [
        {
          barMaxWidth: 22,
          data: props.sample.trend.map((point) => point.inputTokens),
          name: inputLabel,
          stack: 'tokens',
          type: 'bar',
        },
        {
          barMaxWidth: 22,
          data: props.sample.trend.map((point) => point.outputTokens),
          name: outputLabel,
          stack: 'tokens',
          type: 'bar',
        },
      ],
      tooltip: { trigger: 'axis' },
      xAxis: { ...axisStyle(), data: labels, type: 'category' },
      yAxis: { ...axisStyle(), type: 'value' },
    };
  }
  if (props.kind === 'tasks') {
    return {
      color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#8c8c8c', '#722ed1'],
      legend: { bottom: 0, textStyle: { color: '#64748b' } },
      series: [
        {
          data: taskStatusData.value.length
            ? taskStatusData.value
            : [{ name: $t('page.aurora.panel.overview.noTasks'), value: 1 }],
          emphasis: {
            itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.18)' },
          },
          label: { formatter: '{b}\n{c}' },
          radius: ['42%', '68%'],
          type: 'pie',
        },
      ],
      tooltip: { trigger: 'item' },
    };
  }
  if (props.kind === 'cost') {
    return {
      color: ['#13c2c2'],
      grid: { bottom: 30, containLabel: true, left: 15, right: 25, top: 20 },
      series: [
        {
          barMaxWidth: 28,
          data: costData.value.length
            ? costData.value.map((item) => item.value)
            : [0],
          itemStyle: { borderRadius: [0, 5, 5, 0] },
          type: 'bar',
        },
      ],
      tooltip: { trigger: 'axis' },
      xAxis: { ...axisStyle(), type: 'value' },
      yAxis: {
        ...axisStyle(),
        data: costData.value.length
          ? costData.value.map((item) => item.name)
          : [$t('page.aurora.panel.overview.noCost')],
        type: 'category',
      },
    };
  }

  const requestsLabel = $t('page.aurora.dashboard.requests');
  const modelCallsLabel = $t('page.aurora.panel.overview.modelCalls');
  return {
    color: ['#1677ff', '#13c2c2'],
    grid: {
      bottom: 24,
      containLabel: true,
      left: 18,
      right: 18,
      top: 48,
    },
    legend: {
      data: [requestsLabel, modelCallsLabel],
      left: 'center',
      orient: 'horizontal',
      textStyle: { color: '#64748b' },
      top: 4,
    },
    series: [
      {
        areaStyle: { opacity: 0.12 },
        data: props.sample.trend.map((point) => point.requests),
        name: requestsLabel,
        smooth: true,
        symbol: 'none',
        type: 'line',
      },
      {
        data: props.sample.trend.map((point) => point.modelCalls),
        name: modelCallsLabel,
        smooth: true,
        symbol: 'none',
        type: 'line',
      },
    ],
    tooltip: { trigger: 'axis' },
    xAxis: {
      ...axisStyle(),
      boundaryGap: false,
      data: labels,
      type: 'category',
    },
    yAxis: { ...axisStyle(), type: 'value' },
  };
}

function render() {
  return renderEcharts(chartOptions());
}

onMounted(render);
watch(
  () => [
    props.kind,
    props.tasks,
    props.cost,
    props.sample,
    preferences.app.locale,
  ],
  () => void render(),
  { deep: true },
);
</script>

<template>
  <EchartsUI ref="chartRef" height="300px" />
</template>
