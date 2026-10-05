import { ReadableStream } from 'node:stream/web';

/**
 * A response whose body streams the given chunks, split wherever the test
 * says, as a network would. Built by hand: the fetch mock's Response has no
 * web stream body. Each chunk is handed over only when read, after onRead
 * is told its index, so a test can see what was reported before it.
 */
export const streamResponse = (
  chunks: Array<string>,
  onRead?: (index: number) => void
): Response => {
  const encoder = new TextEncoder();
  let next = 0;
  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        if (next < chunks.length) {
          onRead?.(next);
          controller.enqueue(encoder.encode(chunks[next++]));
        } else {
          controller.close();
        }
      },
    },
    { highWaterMark: 0 }
  );

  return { ok: true, status: 200, body } as unknown as Response;
};

export const sse = (events: Array<unknown>): string =>
  events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('');
