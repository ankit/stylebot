/*
 * The messages Stylebot's sites and the bridge exchange over postMessage. A
 * page sends `stylebot:<verb>` with an id and gets `stylebot:<verb>:result`
 * back with the same id; the bridge sends `stylebot:event:<what>` unasked.
 * ping → pong and install → installed predate this and stay for stylebot.dev.
 */

import type { GalleryDraft, GalleryPublishStatus } from '@stylebot/types';

// The protocol's version, which the bridge marks on <html>.
export const BRIDGE_VERSION = '1';

export type PingRequest = { type: 'stylebot:ping' };

export type PongReply = { type: 'stylebot:pong' };

export type InstallRequest = {
  type: 'stylebot:install';
  id: string;
  url: string;
  name: string;
  css: string;
};

export type InstalledReply = {
  type: 'stylebot:installed';
  id: string;
  profileName: string | null;
};

// The style's gallery id doubles as the request's.
export type PreviewRequest = { type: 'stylebot:preview'; id: number };

export type PreviewResult = {
  type: 'stylebot:preview:result';
  id: number;
  ok: boolean;
};

export type StatusRequest = {
  type: 'stylebot:status';
  id: string;
  styleIds: Array<number>;
};

export type StatusResult = {
  type: 'stylebot:status:result';
  id: string;
  // The profile name each requested style is installed as, by its id.
  installed: Record<string, string>;
  // On the gallery, the requested styles published from here, by their ids.
  published: Record<string, GalleryPublishStatus>;
};

// Publishes the edits to the style, by its id, from the requesting tab.
export type PublishRequest = { type: 'stylebot:publish'; id: number };

export type PublishResult = {
  type: 'stylebot:publish:result';
  id: number;
  ok: boolean;
};

export type DraftRequest = { type: 'stylebot:draft'; id: string };

export type DraftResult = {
  type: 'stylebot:draft:result';
  id: string;
  // Null for a draft that's unknown, expired or already published.
  draft: GalleryDraft | null;
};

// The gallery published a draft, by the id its publish page was opened with.
export type PublishedRequest = {
  type: 'stylebot:published';
  id: string;
  styleId: number;
  version: number;
  slug: string;
};

export type PublishedResult = {
  type: 'stylebot:published:result';
  id: string;
  ok: boolean;
};

// The gallery deleted one of its styles; its id doubles as the request's.
export type DeletedRequest = { type: 'stylebot:deleted'; id: number };

export type DeletedResult = {
  type: 'stylebot:deleted:result';
  id: number;
  ok: boolean;
};

// Each request a page can send, and the reply the bridge answers it with.
export type SiteMessages = {
  'stylebot:ping': { request: PingRequest; reply: PongReply };
  'stylebot:install': { request: InstallRequest; reply: InstalledReply };
  'stylebot:preview': { request: PreviewRequest; reply: PreviewResult };
  'stylebot:status': { request: StatusRequest; reply: StatusResult };
  'stylebot:publish': { request: PublishRequest; reply: PublishResult };
  'stylebot:draft': { request: DraftRequest; reply: DraftResult };
  'stylebot:published': { request: PublishedRequest; reply: PublishedResult };
  'stylebot:deleted': { request: DeletedRequest; reply: DeletedResult };
};

export type SiteRequestType = keyof SiteMessages;
export type SiteRequest = SiteMessages[SiteRequestType]['request'];
export type SiteReply = SiteMessages[SiteRequestType]['reply'];

// A style previewed from the page was installed from its preview's tab.
export type InstalledEvent = {
  type: 'stylebot:event:installed';
  id: number;
  profileName: string;
};
