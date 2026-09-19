import net from 'node:net';

/*
 * Minimal client for Firefox's Remote Debugging Protocol — the same wire protocol
 * `web-ext run` and about:debugging use.
 */

export type Packet = {
  from?: string;
  type?: string;
  error?: string;
  message?: string;
} & Record<string, unknown>;

type Pending = {
  resolve: (packet: Packet) => void;
  reject: (error: Error) => void;
};

const CONNECT_RETRY_MS = 120;

export class FirefoxRdpClient {
  private buffer = Buffer.alloc(0);
  // RDP allows one in-flight request per actor, so replies are matched by sender.
  private readonly pending = new Map<string, Pending>();
  private readonly eventHandlers = new Map<string, (packet: Packet) => void>();

  private constructor(private readonly socket: net.Socket) {
    socket.on('data', chunk => this.onData(chunk));
  }

  /**
   * Connects to the debugger server, retrying while Firefox is still starting it —
   * the process is up well before `--start-debugger-server` begins listening.
   */
  static async connect(
    port: number,
    timeoutMs = 30_000
  ): Promise<FirefoxRdpClient> {
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      try {
        const socket = await new Promise<net.Socket>((resolve, reject) => {
          const s = net.createConnection({ port, host: '127.0.0.1' });
          s.once('connect', () => resolve(s));
          s.once('error', reject);
        });

        const client = new FirefoxRdpClient(socket);
        // The server greets with an unsolicited { from: 'root', applicationType } packet.
        await client.expect('root');
        return client;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ECONNREFUSED' || Date.now() > deadline) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, CONNECT_RETRY_MS));
      }
    }
  }

  request<T extends object = Record<string, never>>(
    packet: { to: string; type: string } & Record<string, unknown>
  ): Promise<Packet & T> {
    const json = JSON.stringify(packet);
    const reply = this.expect(packet.to);
    this.socket.write(`${Buffer.byteLength(json)}:${json}`);
    return reply as Promise<Packet & T>;
  }

  onEvent(type: string, handler: (packet: Packet) => void): void {
    this.eventHandlers.set(type, handler);
  }

  close(): void {
    this.socket.destroy();
  }

  private expect(actor: string): Promise<Packet> {
    return new Promise((resolve, reject) =>
      this.pending.set(actor, { resolve, reject })
    );
  }

  // Packets are framed as `<byte length>:<json>` with no other delimiter.
  private onData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    for (;;) {
      const separator = this.buffer.indexOf(':');
      if (separator < 0) {
        return;
      }

      const length = parseInt(
        this.buffer.subarray(0, separator).toString(),
        10
      );
      const end = separator + 1 + length;
      if (this.buffer.length < end) {
        return;
      }

      const packet = JSON.parse(
        this.buffer.subarray(separator + 1, end).toString()
      ) as Packet;
      this.buffer = this.buffer.subarray(end);
      this.dispatch(packet);
    }
  }

  private dispatch(packet: Packet): void {
    if (packet.type && !packet.error) {
      this.eventHandlers.get(packet.type)?.(packet);
      return;
    }

    const pending = packet.from ? this.pending.get(packet.from) : undefined;
    if (!pending) {
      return;
    }

    this.pending.delete(packet.from!);
    if (packet.error) {
      pending.reject(new Error(`RDP ${packet.error}: ${packet.message}`));
    } else {
      pending.resolve(packet);
    }
  }
}
