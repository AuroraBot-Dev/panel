import type { ManagedResource, PageQuery, PageResult } from '#/types/aurora';

/** OpenAPI adapter contract; streaming transport is intentionally undefined. */
export interface ConversationsApi {
  list(query: PageQuery): Promise<PageResult<ManagedResource>>;
}
