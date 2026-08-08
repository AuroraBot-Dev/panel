import type { ManagedResource, PageQuery, PageResult } from '#/types/aurora';

export interface PluginsApi {
  listInstalled(query: PageQuery): Promise<PageResult<ManagedResource>>;
  listMarketplace(query: PageQuery): Promise<PageResult<ManagedResource>>;
}
