import { firefox, type BrowserContext } from '@playwright/test';
import net from 'node:net';
import type { Engine, Extension, LaunchOptions } from '../engine';
import { FirefoxExtension } from './extension';

/*
 * Playwright can't load extensions into Firefox, so this engine starts Firefox
 * with its debugger server on and speaks the Remote Debugging Protocol — the same
 * wire protocol `web-ext run` and about:debugging use — to install firefox-dist/
 * as a temporary add-on and reach the extension's background page.
 */

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

  // No openPopup: neither of Playwright's Firefox drivers can attach to
  // moz-extension:// documents (see e2e/README.md).
}
