const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

let dir;
let host;
let fromHost;

/**
 * Writes a message to the host as the browser does, framed with its length.
 */
const sendToHost = message => {
  const body = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(body.length);
  host.stdin.write(Buffer.concat([header, body]));
};

/**
 * Resolves to the next message the host sends the browser.
 */
const nextFromHost = () =>
  new Promise(resolve => {
    const take = () => {
      if (fromHost.length < 4) {
        return false;
      }

      const length = fromHost.readUInt32LE(0);

      if (fromHost.length < 4 + length) {
        return false;
      }

      const message = JSON.parse(fromHost.subarray(4, 4 + length).toString());
      fromHost = fromHost.subarray(4 + length);
      resolve(message);
      return true;
    };

    if (!take()) {
      const onData = () => take() && host.stdout.off('data', onData);
      host.stdout.on('data', onData);
    }
  });

/**
 * Connects to the host's socket as the CLI does, retrying until it listens.
 */
const connect = () =>
  new Promise((resolve, reject) => {
    const attempt = tries => {
      const client = net.connect(path.join(dir, 'h.sock'));

      client.once('connect', () => resolve(client));
      client.once('error', error =>
        tries ? setTimeout(() => attempt(tries - 1), 20) : reject(error)
      );
    };

    attempt(100);
  });

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-'));
  fromHost = Buffer.alloc(0);
  host = spawn(process.execPath, [path.join(__dirname, 'host.mjs')], {
    env: {
      ...process.env,
      HOME: dir,
      STYLEBOT_SOCKET: path.join(dir, 'h.sock'),
    },
  });
  host.stdout.on(
    'data',
    chunk => (fromHost = Buffer.concat([fromHost, chunk]))
  );
});

afterEach(async () => {
  const exited = new Promise(resolve => host.once('exit', resolve));

  host.stdin.end();
  await exited;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('the native host', () => {
  it("writes a stream's events to the CLI as lines, then ends with the response", async () => {
    const client = await connect();
    let output = '';
    const ended = new Promise(resolve => client.on('end', resolve));
    client.on('data', chunk => (output += chunk));

    client.write(`${JSON.stringify({ command: 'watch', args: {} })}\n`);
    const { id } = await nextFromHost();

    sendToHost({ id, event: 'a' });
    sendToHost({ id, event: 'b' });
    sendToHost({ id, result: 'done' });
    await ended;

    expect(
      output
        .trim()
        .split('\n')
        .map(line => JSON.parse(line))
    ).toEqual([
      { id, event: 'a' },
      { id, event: 'b' },
      { id, result: 'done' },
    ]);
  });

  it('cancels a request whose CLI went away before its response', async () => {
    const client = await connect();

    client.write(`${JSON.stringify({ command: 'watch', args: {} })}\n`);
    const { id } = await nextFromHost();

    client.destroy();

    expect(await nextFromHost()).toEqual({ id, cancel: true });
  });
});
