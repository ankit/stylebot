import type { ChatStreamEvent } from '@stylebot/types';

import { ChatProviderError } from './ChatProviderError';
import { createEditStream } from '../apply-css-tool';
import type { EditStream } from '../apply-css-tool';

/**
 * Reads one apply_css call as it streams in, reporting each edit as an
 * edit event as soon as it's complete.
 */
export const startEdits = (
  onEvent: (event: ChatStreamEvent) => void
): EditStream => createEditStream(edit => onEvent({ type: 'edit', edit }));

/**
 * Finishes each apply_css call of a reply once its stream ends, reporting
 * the edits not yet reported, and returns how many edits they made in all.
 * A call whose JSON is broken means the reply was cut off.
 */
export const finishEdits = (streams: Iterable<EditStream>): number => {
  let count = 0;

  for (const stream of streams) {
    const made = stream.finish();

    if (made === null) {
      throw new ChatProviderError('chat_error_incomplete');
    }
    count += made;
  }

  return count;
};
