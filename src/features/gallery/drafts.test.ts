import {
  DRAFT_TTL,
  deleteGalleryDraft,
  getGalleryDraft,
  newGalleryDraftId,
  saveGalleryDraft,
} from './drafts';

const draft = {
  site: 'github.com',
  url: 'github.com',
  profileId: 'dark',
  css: 'body { color: red; }',
  name: 'Dark',
  screenshot: null,
  styleId: null,
};

beforeEach(() => {
  const store: Record<string, unknown> = {};

  jest.useFakeTimers({ now: 1_000_000 });
  global.chrome = {
    storage: {
      session: {
        get: jest.fn(async (key: string) => ({ [key]: store[key] })),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
      },
    },
  } as unknown as typeof chrome;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('gallery drafts', () => {
  /**
   * Saves the draft by a new id, and resolves with the id.
   */
  const save = async (): Promise<string> => {
    const id = newGalleryDraftId();

    await saveGalleryDraft(id, draft);

    return id;
  };

  it('reads a draft back by its id, as often as asked', async () => {
    const id = await save();

    expect(await getGalleryDraft(id)).toEqual({
      ...draft,
      createdAt: 1_000_000,
    });
    expect(await getGalleryDraft(id)).not.toBeNull();
    expect(await getGalleryDraft('unknown')).toBeNull();
  });

  it('gives a new id each time', async () => {
    expect(newGalleryDraftId()).not.toBe(newGalleryDraftId());
  });

  it('forgets a draft once it expires', async () => {
    const id = await save();

    jest.advanceTimersByTime(DRAFT_TTL);

    expect(await getGalleryDraft(id)).toBeNull();
  });

  it('forgets a deleted draft and keeps the others', async () => {
    const deleted = await save();
    const kept = await save();

    await deleteGalleryDraft(deleted);

    expect(await getGalleryDraft(deleted)).toBeNull();
    expect(await getGalleryDraft(kept)).not.toBeNull();
  });
});
