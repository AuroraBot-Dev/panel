import type { ManagedResource, PageQuery, PageResult } from '#/types/aurora';

export interface PromptsApi {
  list(query: PageQuery): Promise<PageResult<ManagedResource>>;
}
