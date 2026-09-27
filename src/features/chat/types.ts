import type { ChatModel, ChatStreamEvent, ChatTurn } from '@stylebot/types';

/**
 * What the system prompt tells the model about the page.
 */
export type ChatPageContext = {
  url: string;
  title: string;
  // An indented list of the page's elements, see getPageOutline.
  outline: string;
  // The page's variables and excerpts of its stylesheets, see
  // getPageCssContext.
  pageCss: string;
  // Stylebot's stylesheet for this site as it stands.
  css: string;
  // The element the user picked, when the request is about just that.
  selector?: string;
};

/**
 * One event read from a server-sent event stream (a provider's streamed
 * reply).
 */
export type ServerSentEvent = {
  event: string;
  data: string;
};

export type ChatStreamArgs = {
  key: string;
  model: ChatModel;
  system: string;
  turns: Array<ChatTurn>;
  signal: AbortSignal;
  onEvent: (event: ChatStreamEvent) => void;
};

/**
 * One LLM API. Adapters translate Stylebot's provider-neutral turns and
 * the apply_css tool into the provider's wire format and back.
 */
export type ChatProvider = {
  /**
   * Resolves when the key works, else rejects with a ChatProviderError.
   */
  validateKey(key: string): Promise<void>;

  /**
   * Streams one reply, emitting text as it arrives, the edits once the tool
   * call completes, then usage and done. Failures arrive as an error event.
   */
  stream(args: ChatStreamArgs): Promise<void>;
};
