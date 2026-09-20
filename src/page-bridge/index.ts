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
export { emptyPageSnapshot } from './utils';
export type { PageBridge, PageBridgeEvents, PageSnapshot } from './PageBridge';
