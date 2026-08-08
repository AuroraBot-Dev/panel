import type { ManagedResource, PageQuery, PageResult } from '#/types/aurora';

export interface ModelsApi {
  list(query: PageQuery): Promise<PageResult<ManagedResource>>;
}
