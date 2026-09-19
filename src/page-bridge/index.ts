import { PageBridge } from './PageBridge';

let bridge: PageBridge | null = null;

export const setPageBridge = (value: PageBridge): void => {
  bridge = value;
};

export const getPageBridge = (): PageBridge => {
  if (!bridge) {
    throw new Error('PageBridge has not been set for this host');
  }

  return bridge;
};

export { LocalPageBridge } from './LocalPageBridge';
export { RemotePageBridge } from './remote-page-bridge/RemotePageBridge';
export { emptyPageSnapshot } from './utils';
export type { PageBridge, PageBridgeEvents, PageSnapshot } from './PageBridge';
export { REMOTE_PAGE_BRIDGE_PORT } from './remote-page-bridge/constants';
export type {
  RemotePageBridgeHandlers,
  RemotePageBridgeSyncedState,
  RemotePageBridgeMessageToPage,
  RemotePageBridgeMessageToWindow,
} from './remote-page-bridge/types';
