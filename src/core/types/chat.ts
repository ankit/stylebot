export type ChatProviderId = 'anthropic' | 'openai' | 'gemini';

/**
 * One property change the model asked for; an empty value removes the
 * property from the rule.
 */
export type ChatCssDeclaration = {
  property: string;
  value: string;
};

export type ChatCssEdit = {
  selector: string;
  declarations: Array<ChatCssDeclaration>;
};

/**
 * What a declaration held before a reply changed it, so the reply can be
 * undone on its own; null means the property wasn't set.
 */
export type ChatCssPreviousValue = {
  selector: string;
  property: string;
  value: string | null;
};

export type ChatUsage = {
  // Uncached input only; cached reads and writes are billed differently.
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
};

/**
 * A picture sent along with a message (a screenshot of the page, or a
 * design to match), already scaled down for the model.
 */
export type ChatImage = {
  // A data: URL.
  dataUrl: string;
  mediaType: 'image/jpeg' | 'image/png';
  // The file's name; empty for a pasted screenshot.
  name: string;
  // Bytes, as sent.
  size: number;
};

export type ChatUserTurn = {
  role: 'user';
  id: string;
  text: string;
  // The element picked when the message was sent, which it's about.
  scope?: string;
  image?: ChatImage;
};

export type ChatAssistantTurn = {
  role: 'assistant';
  id: string;
  text: string;
  edits: Array<ChatCssEdit>;
  previous: Array<ChatCssPreviousValue>;
  // Whether the reply's edits are on the page, flipped by Undo / Reapply.
  applied: boolean;
  // Stopped by the user before its edits arrived; the text is what came in.
  stopped?: boolean;
  model: string;
  // The reply in the provider's own format, for providers that need it back
  // unchanged when the thread is replayed.
  replay?: Array<unknown>;
  usage?: ChatUsage;
};

export type ChatTurn = ChatUserTurn | ChatAssistantTurn;

/**
 * Error codes are locale keys, so the editor can show them in the user's
 * language; detail carries the provider's own message where there is one.
 */
export type ChatErrorKey =
  | 'chat_error_invalid_key'
  | 'chat_error_wrong_provider_key'
  | 'chat_error_rate_limited'
  | 'chat_error_network'
  | 'chat_error_not_connected'
  | 'chat_error_incomplete'
  | 'chat_error_declined'
  | 'chat_error_provider';

export type ChatStreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'edits-start' }
  | { type: 'edits'; edits: Array<ChatCssEdit> }
  // The reply in the provider's own format, for providers that need it back
  // unchanged when the thread is replayed.
  | { type: 'replay'; steps: Array<unknown> }
  | { type: 'usage'; usage: ChatUsage }
  | { type: 'done' }
  | { type: 'error'; errorKey: ChatErrorKey; detail?: string };

export type ChatModelTier = 'balanced' | 'fastest' | 'best';

export type ChatModel = {
  id: string;
  name: string;
  // The name without the provider's, for where the provider is implied.
  shortName: string;
  tier: ChatModelTier;
  // Extra request fields this model takes, merged into every request body.
  requestOptions?: Record<string, unknown>;
};

export type ChatProviderInfo = {
  id: ChatProviderId;
  name: string;
  company: string;
  // What a key looks like, shown in the empty field; left out when the
  // provider issues keys in more than one format.
  keyPlaceholder?: string;
  keyUrl: string;
  usageUrl: string;
  // Keys from this provider always start with it; catches a key pasted into
  // the wrong provider before any request is made.
  keyPrefix?: string;
  models: Array<ChatModel>;
  defaultModel: string;
};

/**
 * Lines of a stylesheet, 1-based and inclusive, as a chat reply's edits
 * occupy them.
 */
export type CssLineRange = { startLine: number; endLine: number };

/**
 * One provider as the editor sees it.
 */
export type ChatProviderStatus = {
  id: ChatProviderId;
  connected: boolean;
  // The model picked for this provider.
  model: string;
  // Enough of the key to recognise it, with its middle hidden.
  maskedKey?: string;
};

/**
 * What the editor knows about the connection; the keys themselves never
 * leave the background.
 */
export type ChatStatus = {
  // Whether any provider has a key.
  connected: boolean;
  // The provider replies come from, and its model.
  provider: ChatProviderId;
  model: string;
  providers: Array<ChatProviderStatus>;
};

/**
 * Sent over the chat port to start a reply. The system prompt is built in
 * the editor, which has the page at hand.
 */
export type ChatStreamRequest = {
  type: 'send';
  system: string;
  turns: Array<ChatTurn>;
};
