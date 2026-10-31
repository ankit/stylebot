const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

jest.mock('./protocol.mjs', () => ({
  cliStamp: () => ({ protocol: 1, version: '1.0.0' }),
}));

const { sendToHost } = require('./socket.mjs');

let dir;
let server;

/**
 * Listens on a socket as the host would, answering each request with
 * whatever reply writes to the client.
 */
const listen = reply =>
  new Promise(resolve => {
    server = net.createServer(client =>
      client.once('data', () => reply(client))
    );
    server.listen(path.join(dir, 'host.sock'), () =>
      resolve(path.join(dir, 'host.sock'))
    );
  });

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-'));
});

afterEach(done => {
  server.close(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    done();
  });
});

describe('sendToHost', () => {
  it('resolves to the response', async () => {
    const socket = await listen(client =>
      client.end(`${JSON.stringify({ id: 1, result: ['tab'] })}\n`)
    );

    expect(await sendToHost(socket, 'tabs')).toEqual({
      id: 1,
      result: ['tab'],
    });
  });

  it('hands each event to onEvent before resolving to the response', async () => {
    const socket = await listen(client => {
      client.write(`${JSON.stringify({ id: 1, event: 'a' })}\n`);
      setTimeout(() => {
        client.write(`${JSON.stringify({ id: 1, event: 'b' })}\n{"id":1,`);
        client.end('"result":"done"}\n');
      }, 10);
    });
    const seen = [];
    const response = await sendToHost(socket, 'watch', {}, 0, event =>
      seen.push(event)
    );

    expect(seen).toEqual(['a', 'b']);
    expect(response).toEqual({ id: 1, result: 'done' });
  });

  it('hands on an event while the response is still to come', async () => {
    let finish;
    const socket = await listen(client => {
      client.write(`${JSON.stringify({ id: 1, event: 'a' })}\n`);
      finish = () => client.end(`${JSON.stringify({ id: 1, result: 1 })}\n`);
    });

    // The host only answers once the event has been handed on.
    expect(await sendToHost(socket, 'watch', {}, 0, () => finish())).toEqual({
      id: 1,
      result: 1,
    });
  });
});
