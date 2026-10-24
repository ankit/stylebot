import type {
  ToggleStylebot,
  GetCommandsResponse,
  GetOptionResponse,
  GetIsStylebotOpen,
  GetIsPageReaderable,
  GetStylesForPageResponse,
  EnableStyle,
  DisableStyle,
  SetActiveProfile,
  RenameProfile,
  DeleteProfile,
  DeleteStyle,
  CreateProfile,
  CreateProfileResponse,
  StylebotOptions,
  EditorSidePanelOpened,
  OpenEditorSidePanel,
  OpenEditorSidePanelResponse,
  RestoreTab,
  GetGallerySuggestions,
  GetGallerySuggestionsResponse,
  PreviewGalleryStyle,
  PreviewGalleryStyleResponse,
  GetGalleryPreview,
  GetGalleryPreviewResponse,
  InstallGalleryPreview,
  InstallGalleryPreviewResponse,
  EndGalleryPreview,
  GetPublishedGalleryStyle,
  GetPublishedGalleryStyleResponse,
  PublishProfileToGallery,
} from '@stylebot/types';
import { getGalleryMenuItem } from '@stylebot/gallery';
import type { GalleryMenuItem } from '@stylebot/gallery';
import { STYLES_KEY, getStylesForPage } from '@stylebot/saved-styles';
import { defaultOptions } from '@stylebot/settings';

import {
  openOptionsPage,
  openReportIssuePage,
  openDonatePage,
  detectChromiumVariantSync,
  doesSidePanelWorkInChromiumVariant,
  getBrowserCommands,
  getPageSupport,
  getRestorePendingKey,
  isWebPageUrl,
} from '@stylebot/utils';
import {
  supportsEditorSidePanel,
  isSidePanelGranted,
  openEditorSidePanel,
} from '@stylebot/side-panel';
import type { PageSupport } from '@stylebot/utils';

export const getCurrentTab = (
  callback: (tab: chrome.tabs.Tab) => void
): void => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab) {
      callback(tab);
    }
  });
};

const isRestorePending = async (tabId: number): Promise<boolean> => {
  const key = getRestorePendingKey(tabId);
  const items = await chrome.storage.session?.get(key).catch(() => undefined);

  return !!items?.[key];
};

/**
 * Whether Stylebot can style the tab, first putting it back into a page an
 * update left for later, which would otherwise ask to be reloaded. Only such
 * a page wakes the background.
 */
export const getRestoredPageSupport = async (
  tab: chrome.tabs.Tab
): Promise<PageSupport> => {
  const support = await getPageSupport(tab);

  if (
    support !== 'unreachable' ||
    tab.id === undefined ||
    !isWebPageUrl(tab.url ?? '') ||
    !(await isRestorePending(tab.id))
  ) {
    return support;
  }

  const message: RestoreTab = { name: 'RestoreTab', tabId: tab.id };

  await new Promise<void>(resolve =>
    chrome.runtime.sendMessage(message, () => {
      void chrome.runtime.lastError;
      resolve();
    })
  );

  return getPageSupport(tab);
};

export const enableStyle = (url: string): void => {
  const message: EnableStyle = { name: 'EnableStyle', url };

  chrome.runtime.sendMessage(message);
};

export const disableStyle = (url: string): void => {
  const message: DisableStyle = { name: 'DisableStyle', url };

  chrome.runtime.sendMessage(message);
};

export const setActiveProfile = (url: string, profileId: string): void => {
  const message: SetActiveProfile = {
    name: 'SetActiveProfile',
    url,
    profileId,
  };

  chrome.runtime.sendMessage(message);
};

export const renameProfile = (
  url: string,
  profileId: string,
  profileName: string
): void => {
  const message: RenameProfile = {
    name: 'RenameProfile',
    url,
    profileId,
    profileName,
  };

  chrome.runtime.sendMessage(message);
};

export const deleteProfile = (url: string, profileId: string): void => {
  const message: DeleteProfile = { name: 'DeleteProfile', url, profileId };

  chrome.runtime.sendMessage(message);
};

export const deleteStyle = (url: string): void => {
  const message: DeleteStyle = { name: 'DeleteStyle', url };

  chrome.runtime.sendMessage(message);
};

/**
 * Adds a blank profile to a url's style and applies it.
 */
export const createProfile = (
  url: string,
  profileName: string
): Promise<CreateProfileResponse> => {
  const message: CreateProfile = {
    name: 'CreateProfile',
    url,
    profileName,
    activate: true,
  };

  return chrome.runtime.sendMessage<CreateProfile, CreateProfileResponse>(
    message
  );
};

/**
 * Reads the tab's styles straight from storage rather than through the
 * background, which may first have to wake its service worker.
 */
export const getStyles = (
  tab: chrome.tabs.Tab,
  callback: (styles: GetStylesForPageResponse) => void
): void => {
  chrome.storage.local.get(STYLES_KEY, items => {
    callback(getStylesForPage(tab.url ?? '', items[STYLES_KEY] || {}));
  });
};

export const getIsStylebotOpen = (
  tab: chrome.tabs.Tab,
  callback: (isOpen: boolean) => void
): void => {
  if (tab.id) {
    const message: GetIsStylebotOpen = {
      name: 'GetIsStylebotOpen',
    };

    chrome.tabs.sendMessage(tab.id, message, (response: boolean) =>
      callback(response)
    );
  }
};

export const getIsPageReaderable = (
  tab: chrome.tabs.Tab,
  callback: (isReaderable: boolean) => void
): void => {
  if (tab.id) {
    const message: GetIsPageReaderable = {
      name: 'GetIsPageReaderable',
    };

    // No response (e.g. no content script on this page, chrome:// urls)
    // means readability can't apply here either.
    chrome.tabs.sendMessage(tab.id, message, (response: boolean) =>
      callback(!!response)
    );
  }
};

export const toggleStylebot = (tab: chrome.tabs.Tab): void => {
  if (tab.id) {
    const message: ToggleStylebot = {
      name: 'ToggleStylebot',
    };

    chrome.tabs.sendMessage(tab.id, message);
    window.close();
  }
};

/**
 * Has the background ask for the sidePanel permission during the click, and
 * reload Stylebot for it, which opens the editor in the page this once.
 */
const grantStylebotSidePanel = (tab: chrome.tabs.Tab, tabId: number) => {
  const message: OpenEditorSidePanel = { name: 'OpenEditorSidePanel', tabId };

  chrome.runtime
    .sendMessage<OpenEditorSidePanel, OpenEditorSidePanelResponse>(message)
    .then(
      granted => (granted ? window.close() : toggleStylebot(tab)),
      () => toggleStylebot(tab)
    );
};

/**
 * Opens the editor in the tab's side panel straight from the popup's click,
 * as the page couldn't once its gesture is gone; falls back to the page,
 * as where the browser won't show the panel.
 */
export const openStylebotSidePanel = (tab: chrome.tabs.Tab): void => {
  if (
    !tab.id ||
    !supportsEditorSidePanel() ||
    !doesSidePanelWorkInChromiumVariant(detectChromiumVariantSync())
  ) {
    toggleStylebot(tab);
    return;
  }

  if (!isSidePanelGranted()) {
    grantStylebotSidePanel(tab, tab.id);
    return;
  }

  const message: EditorSidePanelOpened = {
    name: 'EditorSidePanelOpened',
    tabId: tab.id,
  };

  openEditorSidePanel(tab.id).then(
    () => {
      chrome.runtime.sendMessage(message);
      window.close();
    },
    () => toggleStylebot(tab)
  );
};

/**
 * Reads the shortcuts from the browser, which owns them, and options straight
 * from storage, so the popup's chips and theme never wait on the background.
 */
export const getCommands = (
  callback: (commands: GetCommandsResponse) => void
): void => {
  getBrowserCommands().then(callback);
};

export const getOption = <K extends keyof StylebotOptions>(
  optionName: K,
  callback: (value: GetOptionResponse) => void
): void => {
  chrome.storage.local.get('options', items => {
    callback({ ...defaultOptions, ...items['options'] }[optionName]);
  });
};

export const openOptions = (): void => {
  openOptionsPage();
  window.close();
};

export const openStyleInOptions = (url: string): void => {
  openOptionsPage(`/styles/edit?url=${encodeURIComponent(url)}`);
  window.close();
};

export const openSyncOptions = (): void => {
  openOptionsPage('/sync');
  window.close();
};

/**
 * Opens Stylebot's page in the browser's extension settings, where access to
 * file URLs is turned on.
 */
export const openExtensionDetails = (): void => {
  chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
  window.close();
};

export const reportIssue = (): void => {
  openReportIssuePage();
  window.close();
};

export const donate = (): void => {
  openDonatePage();
  window.close();
};

// Space-triggered activation also scrolls the page by default; swallow that
// along with Enter's native form-submit behavior.
export const onEnterOrSpace = (
  event: KeyboardEvent,
  handler: () => void
): void => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handler();
  }
};

// A SToggleSwitch's <label> shrink-wraps its content, so clicks in a
// wrapping container's padding land nowhere — this extends the hit target.
export const forwardClickToInput = (
  event: MouseEvent,
  container: Element
): void => {
  const target = event.target as HTMLElement;

  if (target.closest('label, input')) {
    return;
  }

  const input = container.querySelector('input') as HTMLInputElement | null;
  input?.click();
};

export const getGallerySuggestions = (
  tab: chrome.tabs.Tab
): Promise<GetGallerySuggestionsResponse> =>
  chrome.runtime.sendMessage<
    GetGallerySuggestions,
    GetGallerySuggestionsResponse
  >({
    name: 'GetGallerySuggestions',
    pageUrl: tab.url ?? '',
    incognito: tab.incognito,
  });

export const previewGalleryStyle = (
  tabId: number,
  id: number
): Promise<PreviewGalleryStyleResponse> =>
  chrome.runtime.sendMessage<PreviewGalleryStyle, PreviewGalleryStyleResponse>({
    name: 'PreviewGalleryStyle',
    tabId,
    id,
  });

export const getGalleryPreview = (
  tabId: number
): Promise<GetGalleryPreviewResponse> =>
  chrome.runtime.sendMessage<GetGalleryPreview, GetGalleryPreviewResponse>({
    name: 'GetGalleryPreview',
    tabId,
  });

export const installGalleryPreview = (
  tabId: number
): Promise<InstallGalleryPreviewResponse> =>
  chrome.runtime.sendMessage<
    InstallGalleryPreview,
    InstallGalleryPreviewResponse
  >({ name: 'InstallGalleryPreview', tabId });

export const endGalleryPreview = (tabId: number): Promise<void> =>
  chrome.runtime.sendMessage<EndGalleryPreview>({
    name: 'EndGalleryPreview',
    tabId,
  });

/**
 * Publishes a profile on the gallery site, from a capture of the tab with it
 * showing.
 */
export const publishProfileToGallery = (
  tabId: number,
  url: string,
  profileId: string
): void => {
  const message: PublishProfileToGallery = {
    name: 'PublishProfileToGallery',
    tabId,
    url,
    profileId,
  };

  chrome.runtime.sendMessage(message);
};

/**
 * A profile's Gallery menu item.
 */
export const getPublishMenuItem = async (
  url: string,
  profileId: string,
  css: string
): Promise<GalleryMenuItem> => {
  const response = await chrome.runtime.sendMessage<
    GetPublishedGalleryStyle,
    GetPublishedGalleryStyleResponse
  >({ name: 'GetPublishedGalleryStyle', url, profileId });

  return getGalleryMenuItem(response, css);
};
