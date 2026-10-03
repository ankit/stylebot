import { buildSystemPrompt } from '@stylebot/chat';
import type {
  ChatAssistantTurn,
  ChatCssEdit,
  ChatCssPreviousValue,
  ChatImage,
  ChatStreamRequest,
  ChatTurn,
  ChatUsage,
  ChatUserTurn,
} from '@stylebot/types';

/**
 * What a reply has gathered by the time its stream ends.
 */
export type ChatReplyResult = {
  id: string;
  model: string;
  edits: Array<ChatCssEdit>;
  previous: Array<ChatCssPreviousValue>;
  matches?: Array<number | null>;
  usage?: ChatUsage;
  replay?: Array<unknown>;
};

export type ChatRequestPage = {
  url: string;
  href: string;
  title: string;
  css: string;
  outline: string;
  pageCss: string;
  // The element picked, which the request is about.
  selector?: string;
};

/**
 * A message as the user sends it: its text, the element picked, and an
 * attached image.
 */
export type ChatMessage = {
  text: string;
  scope?: string;
  image?: ChatImage;
};

/**
 * An id for a turn. It only needs to be unique within one site's thread, and
 * crypto.randomUUID is missing on http pages, where the editor also runs.
 */
export const getTurnId = (): string => Math.random().toString(36).slice(2);

/**
 * Plain copies of the turns, for sending or storing: reactive objects don't
 * survive messaging.
 */
export const getPlainTurns = (turns: Array<ChatTurn>): Array<ChatTurn> =>
  JSON.parse(JSON.stringify(turns));

/**
 * The request for the next reply: the thread so far, and a system prompt
 * describing the page as it stands.
 */
export const getStreamRequest = (
  { url, href, title, css, outline, pageCss, selector }: ChatRequestPage,
  turns: Array<ChatTurn>
): ChatStreamRequest => ({
  type: 'send',
  system: buildSystemPrompt({
    url: href || url,
    title,
    outline,
    pageCss,
    css,
    selector,
  }),
  turns: getPlainTurns(turns),
});

export const getUserTurn = ({
  text,
  scope,
  image,
}: ChatMessage): ChatUserTurn => ({
  role: 'user',
  id: getTurnId(),
  text: text.trim(),
  ...(scope ? { scope } : {}),
  ...(image ? { image } : {}),
});

/**
 * The finished reply as a turn in the thread, with the text that streamed
 * in. It counts as applied when it made edits.
 */
export const getAssistantTurn = (
  { id, model, edits, previous, matches, usage, replay }: ChatReplyResult,
  text: string
): ChatAssistantTurn => ({
  role: 'assistant',
  id,
  text: text.trim(),
  edits,
  previous,
  applied: edits.length > 0,
  model,
  usage,
  ...(matches ? { matches } : {}),
  ...(replay ? { replay } : {}),
});

/**
 * A reply the user stopped: the text that came in, with no edits.
 */
export const getStoppedTurn = (
  text: string,
  model: string
): ChatAssistantTurn => ({
  role: 'assistant',
  id: getTurnId(),
  text: text.trim(),
  edits: [],
  previous: [],
  applied: false,
  stopped: true,
  model,
});

/**
 * Splits off the message whose reply failed, to send again; null when the
 * thread doesn't end with one.
 */
export const getFailedMessage = (
  turns: Array<ChatTurn>
): { turns: Array<ChatTurn>; message: ChatMessage } | null => {
  const last = turns[turns.length - 1];

  if (last?.role !== 'user') {
    return null;
  }

  const { text, scope, image } = last;
  return { turns: turns.slice(0, -1), message: { text, scope, image } };
};
