import { SearchSyncListener } from './search-sync.listener';

describe('SearchSyncListener', () => {
  const serviceIndexer = {
    upsertById: jest.fn(),
    remove: jest.fn(),
    reindexByProviderId: jest.fn(),
    reindexByCategoryId: jest.fn(),
  };
  const providerIndexer = {
    upsertById: jest.fn(),
  };

  const listener = new SearchSyncListener(serviceIndexer as never, providerIndexer as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts services on service upsert events', async () => {
    await listener.handleServiceUpsert({ serviceId: 'service-1' });
    expect(serviceIndexer.upsertById).toHaveBeenCalledWith('service-1');
  });

  it('removes services on remove events', async () => {
    await listener.handleServiceRemove({ serviceId: 'service-1' });
    expect(serviceIndexer.remove).toHaveBeenCalledWith('service-1');
  });

  it('reindexes provider and related services', async () => {
    await listener.handleProviderUpsert({ providerId: 'provider-1' });
    expect(providerIndexer.upsertById).toHaveBeenCalledWith('provider-1');
    expect(serviceIndexer.reindexByProviderId).toHaveBeenCalledWith('provider-1');
  });

  it('reindexes services when category updates', async () => {
    await listener.handleCategoryUpdated({ categoryId: 'cat-1' });
    expect(serviceIndexer.reindexByCategoryId).toHaveBeenCalledWith('cat-1');
  });
});
