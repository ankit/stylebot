import { RoleColorGroups } from '@stylebot/css';
import { PageSnapshot } from '../PageBridge';

/**
 * The slice of editor state the page owns and the window mirrors.
 */
export type RemotePageBridgeSyncedState = {
  url: string;
  css: string;
  enabled: boolean;
  readability: boolean;
};

export type RemotePageBridgeRequestMethod = 'getSnapshot' | 'getPageColors';

export type RemotePageBridgeRequestResult = {
  getSnapshot: PageSnapshot;
  getPageColors: RoleColorGroups;
};

// What the window sends the page.
export type RemotePageBridgeMessageToPage =
  | { type: 'request'; id: number; method: RemotePageBridgeRequestMethod }
  | { type: 'applyCss'; css: string }
  | { type: 'previewCss'; css: string | null }
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
