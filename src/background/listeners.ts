import ContextMenu from './contextmenu';
import BackgroundPageStyles from './styles';

import {
  GetCommands,
  SetCommands,
  GetOption,
  SetOption,
  GetAllOptions,
  OpenOptionsPage,
  OpenDonatePage,
  SetStyle,
  MoveStyle,
  GetAllStyles,
  SetAllStyles,
  GetStylesForPage,
  GetStylesForIframe,
  EnableStyle,
  DisableStyle,
  SetReadability,
  GetReadabilitySettings,
  SetReadabilitySettings,
  GetImportCss,
  RunGoogleDriveSync,
} from './messages';

import {
  TabUpdated,
  BackgroundPageMessage,
  BackgroundPageMessageResponse,
} from '@stylebot/types';

import BackgroundPageOptions from './options';

/**
 * Initialize listeners for the background page
 */
const init = (
  styles: BackgroundPageStyles,
  options: BackgroundPageOptions
): void => {
  chrome.runtime.onMessage.addListener(
    (
      message: BackgroundPageMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: BackgroundPageMessageResponse) => void
    ) => {
      switch (message.name) {
        case 'GetCommands':
          GetCommands(sendResponse);
          break;
        case 'SetCommands':
          SetCommands(message);
          break;

        case 'GetOption':
          GetOption(message, options, sendResponse);
          break;
        case 'SetOption':
          SetOption(message, options);
          break;
        case 'GetAllOptions':
          GetAllOptions(options, sendResponse);
          break;
        case 'OpenOptionsPage':
          OpenOptionsPage();
          break;
        case 'OpenDonatePage':
          OpenDonatePage();
          break;

        case 'SetStyle':
          SetStyle(message, styles);
          break;
        case 'MoveStyle':
          MoveStyle(message, styles);
          break;
        case 'GetAllStyles':
          GetAllStyles(styles, sendResponse);
          break;
        case 'SetAllStyles':
          SetAllStyles(message, styles);
          break;
        case 'GetStylesForPage':
          GetStylesForPage(message, styles, sender, sendResponse);
          break;
        case 'GetStylesForIframe':
          GetStylesForIframe(message, styles, sendResponse);
          break;
        case 'EnableStyle':
          EnableStyle(message, styles);
          break;
        case 'DisableStyle':
          DisableStyle(message, styles);
          break;

        case 'SetReadability':
          SetReadability(message, styles);
          break;
        case 'GetReadabilitySettings':
          GetReadabilitySettings(sendResponse);
          break;
        case 'SetReadabilitySettings':
          SetReadabilitySettings(message);
          break;

        case 'GetImportCss':
          GetImportCss(message, styles, sendResponse);
          break;
        case 'RunGoogleDriveSync':
          RunGoogleDriveSync(message, styles, sendResponse);
          break;
      }

      return true;
    }
  );

  /**
   * Listen when an existing tab is updated
   * and update the context-menu and browser-action
   */
  chrome.tabs.onUpdated.addListener((tabId, _, tab) => {
    if (tab.status === 'complete') {
      if (options.get('contextMenu')) {
        ContextMenu.update(tab);
      }
    }

    const message: TabUpdated = {
      name: 'TabUpdated',
    };

    chrome.tabs.sendMessage(tabId, message);
  });

  /**
   * Listen when a tab is activated to update the context-menu
   */
  chrome.tabs.onActivated.addListener(activeInfo => {
    if (options.get('contextMenu')) {
      chrome.tabs.get(activeInfo.tabId, tab => {
        ContextMenu.update(tab);
      });
    }
  });
};

export default { init };
