export type ApiMode = 'mock' | 'remote';

export const apiMode: ApiMode =
  import.meta.env.VITE_API_MODE === 'remote' ? 'remote' : 'mock';
