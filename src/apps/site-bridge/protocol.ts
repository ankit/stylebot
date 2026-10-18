/*
 * The messages Stylebot's sites and the bridge exchange over postMessage. A
 * page sends `stylebot:<verb>` with an id and gets `stylebot:<verb>:result`
 * back with the same id; the bridge sends `stylebot:event:<what>` unasked.
 * ping → pong and install → installed predate this and stay for stylebot.dev.
 */

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

export type PreviewRequest = { type: 'stylebot:preview'; id: string };

export type PreviewResult = {
  type: 'stylebot:preview:result';
  id: string;
  ok: boolean;
};

export type StatusRequest = {
  type: 'stylebot:status';
  id: string;
  styleIds: Array<string>;
};

export type StatusResult = {
  type: 'stylebot:status:result';
  id: string;
  // The profile name each requested style is installed as.
  installed: Record<string, string>;
};

// Each request a page can send, and the reply the bridge answers it with.
export type SiteMessages = {
  'stylebot:ping': { request: PingRequest; reply: PongReply };
  'stylebot:install': { request: InstallRequest; reply: InstalledReply };
  'stylebot:preview': { request: PreviewRequest; reply: PreviewResult };
  'stylebot:status': { request: StatusRequest; reply: StatusResult };
};

export type SiteRequestType = keyof SiteMessages;
export type SiteRequest = SiteMessages[SiteRequestType]['request'];
export type SiteReply = SiteMessages[SiteRequestType]['reply'];

// A style previewed from the page was installed from its preview's tab.
export type InstalledEvent = {
  type: 'stylebot:event:installed';
  id: string;
  profileName: string;
};
