import type { ServerSentEvent } from '@stylebot/types';

/**
 * Reads a server-sent event stream, calling back once per event. Chunks
 * may split an event (or a line) anywhere, so text is buffered until the
 * blank line that ends each one.
 */
export const readEventStream = async (
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ServerSentEvent) => void
): Promise<void> => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event = '';
  let data: Array<string> = [];

  const dispatch = () => {
    if (data.length) {
      onEvent({ event: event || 'message', data: data.join('\n') });
    }
    event = '';
    data = [];
  };

  const processLine = (line: string) => {
    if (line === '') {
      dispatch();
    } else if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data.push(line.slice(5).replace(/^ /, ''));
    }
  };

  for (;;) {
    const { done, value } = await reader.read();

    buffer += decoder.decode(value, { stream: !done });

    const lines = buffer.split(/\r\n|\r|\n/);
    buffer = done ? '' : lines.pop() ?? '';
    lines.forEach(processLine);

    if (done) {
      dispatch();
      return;
    }
  }
};
