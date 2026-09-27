import { ReadableStream } from 'node:stream/web';

/**
 * A response whose body streams the given chunks, split wherever the test
 * says, as a network would. Built by hand: the fetch mock's Response has no
 * web stream body.
 */
export const streamResponse = (chunks: Array<string>): Response => {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });

  return { ok: true, status: 200, body } as unknown as Response;
};

export const sse = (events: Array<unknown>): string =>
  events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('');
