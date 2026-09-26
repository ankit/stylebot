import type { RoleColorGroups } from '@stylebot/css';
import type { PageSnapshot } from '../PageBridge';

/**
 * The slice of editor state the page owns and the window mirrors.
 */
export type RemotePageBridgeSyncedState = {
  url: string;
  css: string;
  enabled: boolean;
  readability: boolean;
  forceImportant: boolean;
};

export type RemotePageBridgeRequestArgs = {
  getSnapshot: [];
  getPageColors: [];
  getComputedStyles: [selector: string, properties: Array<string>];
  getPageOutline: [];
  getPageCssContext: [selector: string];
};

export type RemotePageBridgeRequestMethod = keyof RemotePageBridgeRequestArgs;

export type RemotePageBridgeRequestResult = {
  getSnapshot: PageSnapshot;
  getPageColors: RoleColorGroups;
  getComputedStyles: Record<string, string>;
  getPageOutline: string;
  getPageCssContext: string;
};

export type RemotePageBridgeRequest = {
  [M in RemotePageBridgeRequestMethod]: {
    type: 'request';
    id: number;
    method: M;
    args: RemotePageBridgeRequestArgs[M];
  };
}[RemotePageBridgeRequestMethod];

// What the window sends the page.
export type RemotePageBridgeMessageToPage =
  | RemotePageBridgeRequest
  | { type: 'applyCss'; css: string; forceImportant: boolean }
  | {
      type: 'previewCss';
      preview: { css: string; forceImportant: boolean } | null;
    }
  | { type: 'applyReadability'; value: boolean }
  | { type: 'startInspecting' }
  | { type: 'stopInspecting' }
  | { type: 'highlight'; selector: string }
  | { type: 'unhighlight' }
  | { type: 'openInPage' };

// What the page sends the window.
export type RemotePageBridgeMessageToWindow =
  | {
      type: 'connected';
      state: RemotePageBridgeSyncedState;
      snapshot: PageSnapshot;
      activeSelector: string;
    }
  | { type: 'response'; id: number; result?: unknown; error?: string }
  | { type: 'stateChanged'; state: Partial<RemotePageBridgeSyncedState> }
  | { type: 'snapshotChanged'; snapshot: PageSnapshot }
  | {
      type: 'selectorChosen';
      selector: string;
      source: 'inspector' | 'contextMenu';
    }
  | { type: 'inspectingStopped' };

export type RemotePageBridgeHandlers = {
  onStateChanged: (state: Partial<RemotePageBridgeSyncedState>) => void;
  onSnapshotChanged: (snapshot: PageSnapshot) => void;
  onContextMenuSelector: (selector: string) => void;
  onInspectingStopped: () => void;
};
