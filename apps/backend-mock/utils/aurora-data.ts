export const agents = [
  {
    features: ['Chat', 'Memory', 'Prompt cache', 'Plugins'],
    id: 'aurora-primary',
    name: 'Aurora Primary',
    status: 'online',
    uptimeSeconds: 532_800,
    version: '0.1.0-alpha',
  },
  {
    features: ['Chat', 'Observation', 'Safe mode'],
    id: 'aurora-sandbox',
    name: 'Aurora Sandbox',
    status: 'degraded',
    uptimeSeconds: 79_320,
    version: '0.1.0-alpha',
  },
] as const;

export const metricsByRange = {
  '24h': {
    averageLatencyMs: 2470,
    cacheHitRate: 68.2,
    cost: 3.29,
    inputTokens: 3_826_400,
    messages: 3031,
    outputTokens: 1_352_600,
    requests: 1945,
  },
  '7d': {
    averageLatencyMs: 2380,
    cacheHitRate: 64.8,
    cost: 21.84,
    inputTokens: 24_280_000,
    messages: 19_742,
    outputTokens: 8_940_000,
    requests: 13_608,
  },
  '30d': {
    averageLatencyMs: 2510,
    cacheHitRate: 61.3,
    cost: 92.46,
    inputTokens: 101_300_000,
    messages: 83_915,
    outputTokens: 37_620_000,
    requests: 57_244,
  },
} as const;

export const storage = [
  { label: 'Images', sizeBytes: 313_524_224 },
  { label: 'Emoji', sizeBytes: 801_112_064 },
  { label: 'Logs', sizeBytes: 3_006_477_107 },
  { label: 'Datasets', sizeBytes: 925_892_608 },
];
