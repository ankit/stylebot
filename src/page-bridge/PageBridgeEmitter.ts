import { PageBridgeEvents } from './PageBridge';

type Listeners = {
  [E in keyof PageBridgeEvents]: Set<PageBridgeEvents[E]>;
};

/**
 * Minimal typed event emitter shared by the bridge implementations.
 */
export class PageBridgeEmitter {
  private listeners: Listeners = {
    select: new Set(),
    connection: new Set(),
  };

  on<E extends keyof PageBridgeEvents>(
    event: E,
    listener: PageBridgeEvents[E]
  ): () => void {
    this.listeners[event].add(listener);
    return () => {
      this.listeners[event].delete(listener);
    };
  }

  protected emit<E extends keyof PageBridgeEvents>(
    event: E,
    ...args: Parameters<PageBridgeEvents[E]>
  ): void {
    this.listeners[event].forEach(listener =>
      (listener as (...a: Parameters<PageBridgeEvents[E]>) => void)(...args)
    );
  }
}
