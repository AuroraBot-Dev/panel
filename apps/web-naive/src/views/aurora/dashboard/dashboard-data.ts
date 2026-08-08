export type DashboardRange = '7d' | '24h' | '30d';

export interface DashboardTrendPoint {
  inputTokens: number;
  label: string;
  modelCalls: number;
  outputTokens: number;
  requests: number;
}

export interface DashboardStorageItem {
  key: 'datasets' | 'emoji' | 'images' | 'logs';
  sizeBytes: number;
}

export interface DashboardSampleData {
  averageLatencyMs: number;
  cacheHitRate: number;
  inputTokens: number;
  messages: number;
  outputTokens: number;
  requests: number;
  storage: DashboardStorageItem[];
  trend: DashboardTrendPoint[];
}

const storage: DashboardStorageItem[] = [
  { key: 'images', sizeBytes: 313_524_224 },
  { key: 'emoji', sizeBytes: 801_112_064 },
  { key: 'logs', sizeBytes: 3_006_477_107 },
  { key: 'datasets', sizeBytes: 925_892_608 },
];

export const dashboardSamples: Record<DashboardRange, DashboardSampleData> = {
  '24h': {
    averageLatencyMs: 2470,
    cacheHitRate: 68.2,
    inputTokens: 3_826_400,
    messages: 3031,
    outputTokens: 1_352_600,
    requests: 1945,
    storage,
    trend: [
      {
        inputTokens: 224_480,
        label: '00:00',
        modelCalls: 86,
        outputTokens: 75_640,
        requests: 122,
      },
      {
        inputTokens: 320_160,
        label: '02:00',
        modelCalls: 118,
        outputTokens: 107_880,
        requests: 174,
      },
      {
        inputTokens: 268_640,
        label: '04:00',
        modelCalls: 101,
        outputTokens: 90_520,
        requests: 146,
      },
      {
        inputTokens: 437_920,
        label: '06:00',
        modelCalls: 163,
        outputTokens: 147_560,
        requests: 238,
      },
      {
        inputTokens: 371_680,
        label: '08:00',
        modelCalls: 141,
        outputTokens: 125_240,
        requests: 202,
      },
      {
        inputTokens: 581_440,
        label: '10:00',
        modelCalls: 216,
        outputTokens: 195_920,
        requests: 316,
      },
      {
        inputTokens: 498_640,
        label: '12:00',
        modelCalls: 189,
        outputTokens: 168_020,
        requests: 271,
      },
      {
        inputTokens: 745_200,
        label: '14:00',
        modelCalls: 274,
        outputTokens: 251_100,
        requests: 405,
      },
      {
        inputTokens: 629_280,
        label: '16:00',
        modelCalls: 235,
        outputTokens: 212_040,
        requests: 342,
      },
      {
        inputTokens: 877_680,
        label: '18:00',
        modelCalls: 326,
        outputTokens: 295_740,
        requests: 477,
      },
      {
        inputTokens: 789_360,
        label: '20:00',
        modelCalls: 294,
        outputTokens: 265_980,
        requests: 429,
      },
      {
        inputTokens: 1_023_040,
        label: '22:00',
        modelCalls: 378,
        outputTokens: 344_720,
        requests: 556,
      },
    ],
  },
  '7d': {
    averageLatencyMs: 2380,
    cacheHitRate: 64.8,
    inputTokens: 24_280_000,
    messages: 19_742,
    outputTokens: 8_940_000,
    requests: 13_608,
    storage,
    trend: [
      {
        inputTokens: 2_817_000,
        label: 'Mon',
        modelCalls: 1294,
        outputTokens: 1_016_000,
        requests: 1610,
      },
      {
        inputTokens: 3_104_000,
        label: 'Tue',
        modelCalls: 1437,
        outputTokens: 1_128_000,
        requests: 1798,
      },
      {
        inputTokens: 3_298_000,
        label: 'Wed',
        modelCalls: 1521,
        outputTokens: 1_207_000,
        requests: 1894,
      },
      {
        inputTokens: 3_724_000,
        label: 'Thu',
        modelCalls: 1698,
        outputTokens: 1_381_000,
        requests: 2076,
      },
      {
        inputTokens: 4_012_000,
        label: 'Fri',
        modelCalls: 1814,
        outputTokens: 1_496_000,
        requests: 2217,
      },
      {
        inputTokens: 3_806_000,
        label: 'Sat',
        modelCalls: 1720,
        outputTokens: 1_402_000,
        requests: 2070,
      },
      {
        inputTokens: 3_519_000,
        label: 'Sun',
        modelCalls: 1608,
        outputTokens: 1_310_000,
        requests: 1943,
      },
    ],
  },
  '30d': {
    averageLatencyMs: 2510,
    cacheHitRate: 61.3,
    inputTokens: 101_300_000,
    messages: 83_915,
    outputTokens: 37_620_000,
    requests: 57_244,
    storage,
    trend: [
      {
        inputTokens: 15_820_000,
        label: '1–5',
        modelCalls: 7120,
        outputTokens: 5_790_000,
        requests: 8890,
      },
      {
        inputTokens: 16_460_000,
        label: '6–10',
        modelCalls: 7430,
        outputTokens: 6_040_000,
        requests: 9324,
      },
      {
        inputTokens: 17_210_000,
        label: '11–15',
        modelCalls: 7710,
        outputTokens: 6_390_000,
        requests: 9678,
      },
      {
        inputTokens: 16_990_000,
        label: '16–20',
        modelCalls: 7580,
        outputTokens: 6_280_000,
        requests: 9532,
      },
      {
        inputTokens: 17_680_000,
        label: '21–25',
        modelCalls: 7920,
        outputTokens: 6_620_000,
        requests: 9941,
      },
      {
        inputTokens: 17_140_000,
        label: '26–30',
        modelCalls: 7835,
        outputTokens: 6_500_000,
        requests: 9879,
      },
    ],
  },
};
