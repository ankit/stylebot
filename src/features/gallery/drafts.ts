import type { GalleryDraft } from '@stylebot/types';

const DRAFTS_KEY = 'gallery-drafts';

// Long enough to sign in on the gallery site and fill in the form.
export const DRAFT_TTL = 10 * 60 * 1000;

/**
 * A draft as kept here: what the site reads, the profile it publishes, and
 * when it was handed over.
 */
export type StoredGalleryDraft = GalleryDraft & {
  profileId: string;
  createdAt: number;
};

type Drafts = Record<string, StoredGalleryDraft>;

const isLive = ({ createdAt }: StoredGalleryDraft): boolean =>
  Date.now() - createdAt < DRAFT_TTL;

/**
 * The drafts still live, in session storage, so a browser restart drops them
 * with their screenshots.
 */
const readDrafts = async (): Promise<Drafts> => {
  const items = await chrome.storage.session.get(DRAFTS_KEY);
  const drafts = (items[DRAFTS_KEY] ?? {}) as Drafts;

  return Object.fromEntries(
    Object.entries(drafts).filter(([, draft]) => isLive(draft))
  );
};

const writeDrafts = (drafts: Drafts): Promise<void> =>
  chrome.storage.session.set({ [DRAFTS_KEY]: drafts });

/**
 * Keeps a draft for the gallery site to read, by an id that's hard to guess
 * from newGalleryDraftId.
 */
export const saveGalleryDraft = async (
  id: string,
  draft: Omit<StoredGalleryDraft, 'createdAt'>
): Promise<void> => {
  const drafts = await readDrafts();

  await writeDrafts({ ...drafts, [id]: { ...draft, createdAt: Date.now() } });
};

export const newGalleryDraftId = (): string => crypto.randomUUID();

/**
 * A draft by its id, or null once it's expired or published.
 */
export const getGalleryDraft = async (
  id: string
): Promise<StoredGalleryDraft | null> => {
  const drafts = await readDrafts();

  return Object.hasOwn(drafts, id) ? drafts[id] : null;
};

export const deleteGalleryDraft = async (id: string): Promise<void> => {
  const { [id]: _deleted, ...rest } = await readDrafts();

  await writeDrafts(rest);
};
