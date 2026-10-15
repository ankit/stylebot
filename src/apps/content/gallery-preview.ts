import {
  GALLERY_PREVIEW_PORT,
  type GalleryPreviewMessage,
} from '@stylebot/gallery';
import { injectStylesheet, removeStylesheet } from '@stylebot/stylesheets';

import { applyPageState, getPageState } from './page-state';
import { getCompiledStyles } from './saved-styles';

// Keyed like a saved style's url, but no saved style can have it.
const PREVIEW_KEY = 'stylebot:gallery-preview';

/**
 * Takes the page's own styles off and shows a gallery style instead.
 */
const showPreview = async ({
  css,
  importUrls,
}: NonNullable<GalleryPreviewMessage['preview']>): Promise<void> => {
  const state = getPageState(await getCompiledStyles());

  state.styles.forEach(style => removeStylesheet(style.url));
  injectStylesheet(PREVIEW_KEY, css, importUrls);
};

/**
 * Takes the preview off and puts the page's own styles back.
 */
const endPreview = async (): Promise<void> => {
  removeStylesheet(PREVIEW_KEY);
  applyPageState(getPageState(await getCompiledStyles()));
};

/**
 * Previews gallery styles the popup sends over a port, putting the page back
 * when it sends null or closes, so a preview never outlives the popup.
 */
export const listenForGalleryPreview = (): void => {
  chrome.runtime.onConnect.addListener(port => {
    if (port.name !== GALLERY_PREVIEW_PORT) {
      return;
    }

    let previewing = false;

    port.onMessage.addListener(({ preview }: GalleryPreviewMessage) => {
      if (preview) {
        previewing = true;
        showPreview(preview);
      } else if (previewing) {
        previewing = false;
        endPreview();
      }
    });

    port.onDisconnect.addListener(() => {
      if (previewing) {
        endPreview();
      }
    });
  });
};
