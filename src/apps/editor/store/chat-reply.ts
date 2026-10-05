import { buildSystemPrompt } from '@stylebot/chat';
import type {
  ChatAssistantTurn,
  ChatCssPreviousValue,
  ChatImage,
  ChatReplyRound,
  ChatStreamRequest,
  ChatTurn,
  ChatUsage,
  ChatUserTurn,
} from '@stylebot/types';

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
 * One apply_css call as the reply gathered it: the round as the model
 * reads it back, plus what its edits replaced and what it cost.
 */
export type ChatRoundResult = ChatReplyRound & {
  previous: Array<ChatCssPreviousValue>;
  usage?: ChatUsage;
};

export const addUsage = (
  total: ChatUsage | undefined,
  usage: ChatUsage | undefined
): ChatUsage | undefined =>
  total && usage
    ? {
        inputTokens: total.inputTokens + usage.inputTokens,
        outputTokens: total.outputTokens + usage.outputTokens,
        cacheReadTokens:
          (total.cacheReadTokens ?? 0) + (usage.cacheReadTokens ?? 0),
        cacheWriteTokens:
          (total.cacheWriteTokens ?? 0) + (usage.cacheWriteTokens ?? 0),
      }
    : total ?? usage;

/**
 * A reply of one or more apply_css calls as a single turn, which Undo
 * takes back as a whole: their text, edits and usage together, and what
 * the edits replaced before the first call. It counts as applied when it
 * made edits. The calls are kept when there were several, or the page
 * check found anything, for the model to read back.
 */
export const getRoundsTurn = (
  id: string,
  model: string,
  rounds: Array<ChatRoundResult>
): ChatAssistantTurn => {
  const edits = rounds.flatMap(round => round.edits);
  const previous = rounds
    .flatMap(round => round.previous)
    .filter(
      (value, index, all) =>
        all.findIndex(
          ({ selector, property }) =>
            selector === value.selector && property === value.property
        ) === index
    );
  const matches = rounds.every(round => round.matches)
    ? rounds.flatMap(round => round.matches ?? [])
    : undefined;
  const turn: ChatAssistantTurn = {
    role: 'assistant',
    id,
    text: rounds
      .map(round => round.text.trim())
      .filter(Boolean)
      .join('\n\n'),
    edits,
    previous,
    applied: edits.length > 0,
    model,
    usage: rounds.reduce<ChatUsage | undefined>(
      (total, round) => addUsage(total, round.usage),
      undefined
    ),
    ...(matches ? { matches } : {}),
  };
  const [first] = rounds;

  if (rounds.length === 1 && !first.problems?.length) {
    return first.replay ? { ...turn, replay: first.replay } : turn;
  }

  return {
    ...turn,
    rounds: rounds.map(({ text, edits, matches, problems, replay }) => ({
      text: text.trim(),
      edits,
      ...(matches ? { matches } : {}),
      ...(problems?.length ? { problems } : {}),
      ...(replay ? { replay } : {}),
    })),
  };
};

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
