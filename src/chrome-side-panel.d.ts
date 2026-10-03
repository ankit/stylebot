/* The pinned @types/chrome predates the sidePanel API and runtime.getContexts. */
declare namespace chrome.sidePanel {
  export function setOptions(options: {
    tabId?: number;
    path?: string;
    enabled?: boolean;
  }): Promise<void>;

  export function open(options: {
    tabId?: number;
    windowId?: number;
  }): Promise<void>;

  // Chrome 141+.
  export const close:
    | ((options: { tabId?: number; windowId?: number }) => Promise<void>)
    | undefined;
}

declare namespace chrome.runtime {
  export type ContextType = 'SIDE_PANEL';

  export function getContexts(filter: {
    contextTypes?: Array<ContextType>;
  }): Promise<Array<{ documentUrl?: string }>>;
}
