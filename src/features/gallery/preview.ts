import type {
  GalleryPreview,
  GalleryStyle,
  InstallGalleryPreviewResponse,
  PageStyleOptions,
  PreviewGalleryStyleResponse,
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
  setOption: (option: string, value: string) => void;
  getSiteStyles: () => Promise<Array<GalleryStyle>>;
  preview: (id: number) => Promise<PreviewGalleryStyleResponse>;
};

/**
 * What a page holds of its mounted preview controls: `show` moves them to
 * another preview, `remove` ends them, or leaves them to confirm an install.
 */
export type GalleryPreviewControls = {
  show: (preview: GalleryPreview) => void;
  remove: (installed?: boolean) => void;
};

/**
 * What the page gets for each option a preview's style declares, with the
 * values picked in its controls, or undefined when it declares none.
 */
export const getPreviewPageOptions = ({
  options,
  values = {},
}: GalleryPreview): PageStyleOptions | undefined => {
  if (!options) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(options).map(([name, declaration]) => {
      const value = values[name] ?? declaration.default;
      const choice =
        declaration.type === 'select'
          ? declaration.choices?.[value]
          : undefined;

      return [name, { value, css: choice?.css ?? value }];
    })
  );
};

/**
 * The gallery preview bundle sets stylebotGalleryPreviewApp once it has run.
 */
export type GalleryPreviewAppWindow = Window & {
  stylebotGalleryPreviewApp?: {
    mount: (
      preview: GalleryPreview,
      handlers: GalleryPreviewHandlers
    ) => GalleryPreviewControls;
  };
};
