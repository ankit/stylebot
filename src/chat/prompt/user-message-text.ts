import type { ChatUserTurn } from '@stylebot/types';

/**
 * A user message as the model reads it, naming the element it's about when
 * one was picked.
 */
export const userMessageText = (turn: ChatUserTurn): string =>
  turn.scope
    ? `[About the element matching \`${turn.scope}\`]\n${turn.text}`
    : turn.text;
