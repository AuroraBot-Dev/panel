import type { ManagedResource, PageQuery, PageResult } from '#/types/aurora';

export interface LearningApi {
  list(query: PageQuery): Promise<PageResult<ManagedResource>>;
}
