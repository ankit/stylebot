// The port the popup opens to a tab to preview gallery styles on it.
export const GALLERY_PREVIEW_PORT = 'gallery-preview';

/**
 * What the popup sends over the preview port: a compiled style to show in
 * place of the page's own, or null to put the page back.
 */
export type GalleryPreviewMessage = {
  preview: { css: string; importUrls: Array<string> } | null;
};
