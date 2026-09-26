import { readEventStream } from '../read-event-stream';
import { streamResponse } from '../__fixtures__/stream';

const read = async (chunks: Array<string>) => {
  const events: Array<{ event: string; data: string }> = [];
  await readEventStream(streamResponse(chunks).body!, event =>
    events.push(event)
  );
  return events;
};

describe('readEventStream', () => {
  it('reads one event per blank-line-terminated block', async () => {
    expect(await read(['event: a\ndata: 1\n\nevent: b\ndata: 2\n\n'])).toEqual([
      { event: 'a', data: '1' },
      { event: 'b', data: '2' },
    ]);
  });

  it('reassembles events split across chunks, mid-line', async () => {
    expect(await read(['da', 'ta: {"x"', ':1}\n', '\ndata: 2\n\n'])).toEqual([
      { event: 'message', data: '{"x":1}' },
      { event: 'message', data: '2' },
    ]);
  });

  it('joins multi-line data and handles CRLF', async () => {
    expect(await read(['data: a\r\ndata: b\r\n\r\n'])).toEqual([
      { event: 'message', data: 'a\nb' },
    ]);
  });

  it('dispatches a final event that has no trailing blank line', async () => {
    expect(await read(['data: last'])).toEqual([
      { event: 'message', data: 'last' },
    ]);
  });
});
