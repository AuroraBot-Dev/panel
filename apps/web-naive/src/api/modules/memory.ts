import type { ManagedResource, PageQuery, PageResult } from '#/types/aurora';

export interface MemoryApi {
  list(query: PageQuery): Promise<PageResult<ManagedResource>>;
}
