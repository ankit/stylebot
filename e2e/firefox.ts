import { firefox, type BrowserContext } from '@playwright/test';
import net from 'node:net';
import type {
  Engine,
  Extension,
  ExtensionFunction,
  LaunchOptions,
} from './engine';

/*
 * Playwright can't load extensions into Firefox, so this engine starts Firefox
 * with its debugger server on and speaks the Remote Debugging Protocol — the same
 * wire protocol `web-ext run` and about:debugging use — to install firefox-dist/
 * as a temporary add-on and reach the extension's background page.
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

type TargetForm = { actor: string; url: string; consoleActor: string };

type EvaluationResult = {
  resultID: string;
  hasException?: boolean;
  exceptionMessage?: string;
  result?: unknown;
};

type Addon = { id: string; actor: string; manifestURL: string };

/**
 * A temporarily installed extension plus a console into its background page,
 * which is the Firefox stand-in for Chromium's `context.serviceWorkers()[0].evaluate()`.
 */
class FirefoxExtension implements Extension {
  private background: TargetForm | null = null;
  // Armed before each evaluateJSAsync is sent: its result can land in the same TCP
  // chunk as the request's ack, i.e. before the caller has resumed.
  private onResult: ((result: EvaluationResult) => void) | null = null;

  private constructor(
    private readonly client: FirefoxRdpClient,
    readonly id: string
  ) {}

  static async load(
    port: number,
    addonPath: string
  ): Promise<FirefoxExtension> {
    const client = await FirefoxRdpClient.connect(port);

    const root = await client.request<{ addonsActor: string }>({
      to: 'root',
      type: 'getRoot',
    });
    const installed = await client.request<{ addon: { id: string } }>({
      to: root.addonsActor,
      type: 'installTemporaryAddon',
      addonPath,
    });
    const { addons } = await client.request<{ addons: Addon[] }>({
      to: 'root',
      type: 'listAddons',
    });
    const addon = addons.find(a => a.id === installed.addon.id)!;

    const extension = new FirefoxExtension(
      client,
      new URL(addon.manifestURL).host
    );

    let onBackground!: () => void;
    const backgroundReady = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error(
              `Extension ${addon.id} installed but its background page never appeared.`
            )
          ),
        10_000
      );
      onBackground = () => {
        clearTimeout(timer);
        resolve();
      };
    });

    // Target lifecycle events come from the watcher; the background page is one
    // "frame" target among the descriptor's (the other is DevTools' fallback page).
    client.onEvent('target-available-form', packet => {
      const target = packet.target as TargetForm;
      if (target.url.includes('_generated_background_page')) {
        extension.background = target;
        onBackground();
      }
    });
    client.onEvent('target-destroyed-form', packet => {
      const target = packet.target as TargetForm;
      if (extension.background?.actor === target.actor) {
        extension.background = null;
      }
    });
    client.onEvent('evaluationResult', packet => {
      extension.onResult?.(packet as unknown as EvaluationResult);
    });

    const watcher = await client.request<{ actor: string }>({
      to: addon.actor,
      type: 'getWatcher',
      isServerTargetSwitchingEnabled: true,
    });
    await client.request({
      to: watcher.actor,
      type: 'watchTargets',
      targetType: 'frame',
    });
    await backgroundReady;

    return extension;
  }

  isRunning(): boolean {
    return this.background !== null;
  }

  /**
   * Runs `fn(arg)` inside the extension's background page and returns its
   * (JSON-serializable) result, mirroring Playwright's `worker.evaluate(fn, arg)`.
   */
  async evaluate<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R> {
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

    const resultPromise = new Promise<EvaluationResult>(resolve => {
      this.onResult = resolve;
    });
    await this.client.request({
      to: this.background.consoleActor,
      type: 'evaluateJSAsync',
      text,
      mapped: { await: true },
    });
    const result = await resultPromise;
    this.onResult = null;

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

function freePort(): Promise<number> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(0, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

export class FirefoxEngine implements Engine {
  readonly distDir = 'firefox-dist';
  // Chosen at launch, needed again at loadExtension time.
  private rdpPort = 0;

  async launch(
    userDataDir: string,
    options: LaunchOptions
  ): Promise<BrowserContext> {
    this.rdpPort = await freePort();

    return firefox.launchPersistentContext(userDataDir, {
      ...options,
      args: [`--start-debugger-server=${this.rdpPort}`],
      firefoxUserPrefs: {
        'devtools.debugger.prompt-connection': false,
        // MV3 treats <all_urls> content scripts as optional host permissions
        // that a user would normally have to grant on install.
        'extensions.originControls.grantByDefault': true,
        // Firefox terminates idle event pages after 30s, which would take
        // the console we run chrome.storage calls through with it.
        'extensions.background.idle.timeout': 3_600_000,
      },
    });
  }

  loadExtension(
    _context: BrowserContext,
    distPath: string
  ): Promise<Extension> {
    return FirefoxExtension.load(this.rdpPort, distPath);
  }
}
