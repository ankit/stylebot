import type {
  GalleryStyle,
  InstallGalleryPreviewResponse,
  UndoGalleryInstallResponse,
} from '@stylebot/types';

/**
 * Sites with a gallery preview in some tab, so other pages skip asking the
 * background for theirs.
 */
export const GALLERY_PREVIEW_SITES_KEY = 'galleryPreviewSites';

/**
 * What the page's preview controls do when they're used.
 */
export type GalleryPreviewHandlers = {
  install: () => Promise<InstallGalleryPreviewResponse>;
  undo: () => Promise<UndoGalleryInstallResponse>;
  cancel: () => void;
  compare: (on: boolean) => void;
};

/**
 * The gallery preview bundle sets stylebotGalleryPreviewApp once it has run.
 */
export type GalleryPreviewAppWindow = Window & {
  stylebotGalleryPreviewApp?: {
    mount: (
      style: GalleryStyle,
      handlers: GalleryPreviewHandlers
    ) => (installed?: boolean) => void;
  };
};
