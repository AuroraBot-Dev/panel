import type { ManagedResource, PageQuery, PageResult } from '#/types/aurora';

export type ResourceKind = 'blocked-word' | 'emoji' | 'expression';
export interface ResourcesApi {
  list(
    kind: ResourceKind,
    query: PageQuery,
  ): Promise<PageResult<ManagedResource>>;
}
