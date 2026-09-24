import { RoleColorGroups } from '@stylebot/css';

import { PageBridge, PageSnapshot } from '../PageBridge';
import { PageBridgeEmitter } from '../PageBridgeEmitter';
import {
  REMOTE_PAGE_BRIDGE_PORT,
  RETRY_INITIAL_MS,
  RETRY_FACTOR,
  RETRY_MAX_MS,
} from './constants';
import {
  RemotePageBridgeHandlers,
  RemotePageBridgeMessageToPage,
  RemotePageBridgeMessageToWindow,
  RemotePageBridgeRequest,
  RemotePageBridgeRequestArgs,
  RemotePageBridgeRequestMethod,
  RemotePageBridgeRequestResult,
} from './types';

type Pending = {
  resolve: (result: never) => void;
  reject: (error: Error) => void;
};

/**
 * Drives a tab's content script over a long-lived port from the editor
 * window. The port drops whenever the tab navigates or closes; the bridge
 * keeps retrying (and on tab load events) until the content script is back.
 */
export class RemotePageBridge extends PageBridgeEmitter implements PageBridge {
  private tabId: number;
  private handlers: RemotePageBridgeHandlers;
  private port: chrome.runtime.Port | null = null;
  private connected = false;
  private retryDelay = RETRY_INITIAL_MS;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private nextRequestId = 1;
  private pending = new Map<number, Pending>();
  private resolveConnect: (() => void) | null = null;

  constructor(tabId: number, handlers: RemotePageBridgeHandlers) {
    super();
    this.tabId = tabId;
    this.handlers = handlers;

    chrome.tabs.onUpdated.addListener((updatedTabId, changeInfo) => {
      if (updatedTabId === this.tabId && changeInfo.status === 'complete') {
        this.retryDelay = RETRY_INITIAL_MS;
        this.tryConnect();
      }
    });
  }

  /**
   * Resolves once the page first reports it is connected.
   */
  connect(): Promise<void> {
    return new Promise(resolve => {
      this.resolveConnect = resolve;
      this.tryConnect();
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  private tryConnect(): void {
    if (this.port) {
      return;
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    let port: chrome.runtime.Port;
    try {
      port = chrome.tabs.connect(this.tabId, { name: REMOTE_PAGE_BRIDGE_PORT });
    } catch {
      this.scheduleRetry();
      return;
    }

    this.port = port;
    port.onMessage.addListener((message: RemotePageBridgeMessageToWindow) =>
      this.handleMessage(message)
    );
    port.onDisconnect.addListener(() => {
      // Reading lastError marks the "no receiving end" case as handled so
      // Chrome doesn't log it for every retry against a page still loading.
      void chrome.runtime.lastError;
      this.port = null;
      this.setConnected(false);
      this.pending.forEach(({ reject }) =>
        reject(new Error('Page disconnected'))
      );
      this.pending.clear();
      this.scheduleRetry();
    });
  }

  private scheduleRetry(): void {
    if (this.retryTimer) {
      return;
    }

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.tryConnect();
    }, this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * RETRY_FACTOR, RETRY_MAX_MS);
  }

  private setConnected(connected: boolean): void {
    if (this.connected === connected) {
      return;
    }

    this.connected = connected;
    this.emit('connection', connected);
  }

  private handleMessage(message: RemotePageBridgeMessageToWindow): void {
    switch (message.type) {
      case 'connected':
        this.retryDelay = RETRY_INITIAL_MS;
        this.handlers.onStateChanged(message.state);
        this.handlers.onSnapshotChanged(message.snapshot);
        if (message.activeSelector) {
          this.handlers.onContextMenuSelector(message.activeSelector);
        }
        this.setConnected(true);
        this.resolveConnect?.();
        this.resolveConnect = null;
        break;

      case 'response': {
        const pending = this.pending.get(message.id);
        if (!pending) {
          return;
        }
        this.pending.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.result as never);
        }
        break;
      }

      case 'stateChanged':
        this.handlers.onStateChanged(message.state);
        break;

      case 'snapshotChanged':
        this.handlers.onSnapshotChanged(message.snapshot);
        break;

      case 'selectorChosen':
        if (message.source === 'inspector') {
          this.emit('select', message.selector);
        } else {
          this.handlers.onContextMenuSelector(message.selector);
        }
        break;

      case 'inspectingStopped':
        this.handlers.onInspectingStopped();
        break;
    }
  }

  // The page can be gone before onDisconnect says so; a post then throws,
  // which UI handlers calling the bridge shouldn't have to expect.
  private send(message: RemotePageBridgeMessageToPage): void {
    try {
      this.port?.postMessage(message);
    } catch {
      //
    }
  }

  private request<M extends RemotePageBridgeRequestMethod>(
    method: M,
    ...args: RemotePageBridgeRequestArgs[M]
  ): Promise<RemotePageBridgeRequestResult[M]> {
    if (!this.port) {
      return Promise.reject(new Error('Page disconnected'));
    }

    const id = this.nextRequestId++;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.send({
        type: 'request',
        id,
        method,
        args,
      } as RemotePageBridgeRequest);
    });
  }

  getSnapshot(): Promise<PageSnapshot> {
    return this.request('getSnapshot');
  }

  // The page applies against its own url; only the payload crosses over.
  applyCss({
    css,
    forceImportant,
  }: Parameters<PageBridge['applyCss']>[0]): void {
    this.send({ type: 'applyCss', css, forceImportant });
  }

  setPreviewCss(preview: Parameters<PageBridge['setPreviewCss']>[0]): void {
    this.send({ type: 'previewCss', preview });
  }

  applyReadability(value: boolean): void {
    this.send({ type: 'applyReadability', value });
  }

  /**
   * Focuses the page first: Chrome drops mouse-move events for a window that
   * is neither key nor main, so picking couldn't follow the cursor.
   */
  startInspecting(): void {
    this.focusPage();
    this.send({ type: 'startInspecting' });
  }

  stopInspecting(): void {
    this.send({ type: 'stopInspecting' });
  }

  highlight(selector: string): void {
    this.send({ type: 'highlight', selector });
  }

  unhighlight(): void {
    this.send({ type: 'unhighlight' });
  }

  getPageColors(): Promise<RoleColorGroups> {
    return this.request('getPageColors');
  }

  getComputedStyles(
    selector: string,
    properties: Array<string>
  ): Promise<Record<string, string>> {
    return this.request('getComputedStyles', selector, properties);
  }

  openInPage(): void {
    this.send({ type: 'openInPage' });
  }

  focusPage(): void {
    chrome.tabs
      .get(this.tabId)
      .then(async tab => {
        await chrome.tabs.update(this.tabId, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
      })
      .catch(() => undefined);
  }
}
