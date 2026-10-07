import type { ChatTurn } from '@stylebot/types';

const IMAGE_NOTE = '[An image was attached here; it is no longer shown.]';

/**
 * The thread with only its most recent image; older ones are replaced by a
 * note, since each costs as much as a page of text on every later reply.
 */
export const withRecentImages = (turns: Array<ChatTurn>): Array<ChatTurn> => {
  const latest = turns
    .slice()
    .reverse()
    .find(turn => turn.role === 'user' && turn.image);

  return turns.map(turn => {
    if (turn.role !== 'user' || !turn.image || turn === latest) {
      return turn;
    }

    const { image: _image, ...rest } = turn;
    return { ...rest, text: `${turn.text}\n${IMAGE_NOTE}` };
  });
};
