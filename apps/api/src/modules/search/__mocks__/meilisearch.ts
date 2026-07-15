export class Meilisearch {
  constructor(_options?: { host?: string; apiKey?: string }) {}

  index(_uid: string) {
    return {
      search: async () => ({ hits: [], estimatedTotalHits: 0 }),
      addDocuments: async () => ({}),
      deleteDocument: async () => ({}),
      deleteAllDocuments: async () => ({}),
      updateSettings: async () => ({}),
    };
  }

  async health() {
    return { status: 'available' };
  }

  async getIndex(_uid: string) {
    return {};
  }

  async createIndex(_uid: string, _options?: { primaryKey?: string }) {
    return {};
  }
}

export const MeiliSearch = Meilisearch;
export default { Meilisearch, MeiliSearch };
