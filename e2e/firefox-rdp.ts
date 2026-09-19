import net from 'node:net';

/*
 * Minimal client for Firefox's Remote Debugging Protocol — the same wire protocol
 * `web-ext run` and about:debugging use. Playwright can't load extensions into
 * Firefox itself, so this is how the e2e suite installs firefox-dist/ and talks
 * to the extension's background page.
 */

type Packet = {
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

class FirefoxRdpClient {
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

  request(packet: { to: string; type: string } & Record<string, unknown>) {
    const json = JSON.stringify(packet);
    const reply = this.expect(packet.to);
    this.socket.write(`${Buffer.byteLength(json)}:${json}`);
    return reply;
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

type TargetForm = { actor: string; url: string; consoleActor: string };

type EvaluationResult = {
  resultID: string;
  hasException?: boolean;
  exceptionMessage?: string;
  result?: unknown;
};

/**
 * A temporarily installed extension plus a console into its background page,
 * which is the Firefox stand-in for Chromium's `context.serviceWorkers()[0].evaluate()`.
 */
export class FirefoxExtension {
  private background: TargetForm | null = null;
  private backgroundWaiters: (() => void)[] = [];
  // Results can land in the same TCP chunk as the request's ack, i.e. before the
  // caller has seen its resultID — so they're parked here until claimed.
  private readonly results = new Map<string, EvaluationResult>();
  private readonly resultWaiters = new Map<
    string,
    (result: EvaluationResult) => void
  >();

  private constructor(
    private readonly client: FirefoxRdpClient,
    readonly uuid: string
  ) {}

  static async load(
    port: number,
    addonPath: string
  ): Promise<FirefoxExtension> {
    const client = await FirefoxRdpClient.connect(port);

    const root = await client.request({ to: 'root', type: 'getRoot' });
    const installed = await client.request({
      to: root.addonsActor as string,
      type: 'installTemporaryAddon',
      addonPath,
    });
    const addonId = (installed.addon as { id: string }).id;

    const { addons } = (await client.request({
      to: 'root',
      type: 'listAddons',
    })) as { addons: { id: string; actor: string; manifestURL: string }[] };
    const addon = addons.find(a => a.id === addonId)!;
    const uuid = new URL(addon.manifestURL).host;

    const extension = new FirefoxExtension(client, uuid);

    // Target lifecycle events come from the watcher; the background page is one
    // "frame" target among the descriptor's (the other is DevTools' fallback page).
    client.onEvent('target-available-form', packet => {
      const target = packet.target as TargetForm;
      if (target.url.includes('_generated_background_page')) {
        extension.background = target;
        extension.backgroundWaiters.splice(0).forEach(wake => wake());
      }
    });
    client.onEvent('target-destroyed-form', packet => {
      const target = packet.target as TargetForm;
      if (extension.background?.actor === target.actor) {
        extension.background = null;
      }
    });
    client.onEvent('evaluationResult', packet => {
      const result = packet as unknown as EvaluationResult;
      const waiter = extension.resultWaiters.get(result.resultID);
      if (waiter) {
        extension.resultWaiters.delete(result.resultID);
        waiter(result);
      } else {
        extension.results.set(result.resultID, result);
      }
    });

    const watcher = await client.request({
      to: addon.actor,
      type: 'getWatcher',
      isServerTargetSwitchingEnabled: true,
    });
    await client.request({
      to: watcher.actor as string,
      type: 'watchTargets',
      targetType: 'frame',
    });

    await extension.waitForBackground(addonId);
    return extension;
  }

  private waitForBackground(
    addonId: string,
    timeoutMs = 10_000
  ): Promise<void> {
    if (this.background) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error(
              `Extension ${addonId} installed but its background page never appeared.`
            )
          ),
        timeoutMs
      );
      this.backgroundWaiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  /**
   * Runs `fn(arg)` inside the extension's background page and returns its
   * (JSON-serializable) result, mirroring Playwright's `worker.evaluate(fn, arg)`.
   */
  async evaluate<A, R>(fn: (arg: A) => R | Promise<R>, arg?: A): Promise<R> {
    if (!this.background) {
      throw new Error(
        'The extension background page is not running — it was terminated or never started.'
      );
    }

    // The console actor returns objects as remote grips, not values, so the
    // evaluated code serializes the result itself. `mapped.await` makes the actor
    // wait for the async IIFE's promise like DevTools does for top-level await.
    const text = `(async () => JSON.stringify(await (${fn.toString()})(${JSON.stringify(
      arg ?? null
    )})))()`;

    const { resultID } = (await this.client.request({
      to: this.background.consoleActor,
      type: 'evaluateJSAsync',
      text,
      mapped: { await: true },
    })) as { resultID: string };

    const result =
      this.results.get(resultID) ??
      (await new Promise<EvaluationResult>(resolve =>
        this.resultWaiters.set(resultID, resolve)
      ));
    this.results.delete(resultID);
    if (result.hasException) {
      throw new Error(result.exceptionMessage);
    }

    return typeof result.result === 'string'
      ? JSON.parse(result.result)
      : (undefined as R);
  }

  close(): void {
    this.client.close();
  }
}
