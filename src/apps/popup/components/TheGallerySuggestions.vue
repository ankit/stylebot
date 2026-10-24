<template>
  <div v-if="shownStyles.length">
    <div class="popup-divider" />

    <section class="gallery">
      <div class="gallery-heading">
        <s-text as="h2" size="caption" variant="muted" medium>
          {{ t('gallery') }}
        </s-text>
        <a
          v-if="browseUrl"
          class="browse"
          :href="browseUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('browse_all') }}
        </a>
      </div>

      <gallery-suggestion
        v-for="style in shownStyles"
        :key="style.id"
        :style-data="style"
        :previewing="style.id === previewId"
        :disabled="installing"
        @preview="preview(style)"
        @install="install(style)"
        @cancel="cancel"
      />

      <s-callout v-if="error" tone="danger">{{ error }}</s-callout>
    </section>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SCallout, SText } from '@stylebot/components';
import { galleryErrorText, getGallerySiteUrl } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

import GallerySuggestion from './GallerySuggestion.vue';
import {
  endGalleryPreview,
  getGalleryPreview,
  getGallerySuggestions,
  installGalleryPreview,
  previewGalleryStyle,
} from '../utils';

const SHOWN = 2;

type Data = {
  styles: Array<GalleryStyle>;
  site: string | null;
  previewId: number | null;
  installing: boolean;
  error: string;
};

/**
 * The site's most installed gallery styles. Clicking one previews it on the
 * tab in place of the site's own style, as the tab moves around the site,
 * until it's installed as a new profile or cancelled, here or on the page.
 */
export default Vue.extend({
  name: 'TheGallerySuggestions',

  components: {
    GallerySuggestion,
    SCallout,
    SText,
  },

  props: {
    tab: {
      type: Object as PropType<chrome.tabs.Tab>,
      required: true,
    },

    // The site's profile names; a gallery style with one of them is taken
    // to be installed already.
    profileNames: {
      type: Array as PropType<Array<string>>,
      default: () => [],
    },
  },

  data(): Data {
    return {
      styles: [],
      site: null,
      previewId: null,
      installing: false,
      error: '',
    };
  },

  computed: {
    browseUrl(): string {
      return this.site ? getGallerySiteUrl(this.site) : '';
    },

    shownStyles(): Array<GalleryStyle> {
      const names = new Set(
        this.profileNames.map(name => name.trim().toLowerCase())
      );

      const shown = this.styles
        .filter(style => !names.has(style.name.trim().toLowerCase()))
        .slice(0, SHOWN);
      const previewed = this.styles.find(style => style.id === this.previewId);

      return previewed && !shown.includes(previewed)
        ? [previewed, ...shown.slice(0, SHOWN - 1)]
        : shown;
    },
  },

  async created() {
    const tabId = this.tab.id;
    const [response, current] = await Promise.all([
      getGallerySuggestions(this.tab),
      tabId === undefined ? null : getGalleryPreview(tabId),
    ]);

    // A gallery that can't be reached leaves the popup as it always was.
    if (response?.ok) {
      this.styles = response.styles;
      this.site = response.site;
    }

    const preview = current?.preview;

    if (preview) {
      if (!this.styles.some(style => style.id === preview.style.id)) {
        this.styles = [preview.style, ...this.styles];
      }

      this.previewId = preview.style.id;
      this.$emit('preview', true);
    }
  },

  methods: {
    async preview(style: GalleryStyle): Promise<void> {
      if (this.tab.id === undefined) {
        return;
      }

      this.error = '';
      this.previewId = style.id;
      this.$emit('preview', true);

      const response = await previewGalleryStyle(this.tab.id, style.id);

      // Another style may have been picked while this one loaded.
      if (this.previewId !== style.id) {
        return;
      }

      if (!response.ok) {
        this.error = galleryErrorText(response);
        this.cancel();
      }
    },

    /**
     * Puts the page back as it was; the popup also calls it when a profile
     * is picked.
     */
    cancel(): void {
      if (this.previewId !== null && this.tab.id !== undefined) {
        endGalleryPreview(this.tab.id);
      }

      this.previewId = null;
      this.$emit('preview', false);
    },

    async install(style: GalleryStyle): Promise<void> {
      if (this.tab.id === undefined) {
        return;
      }

      this.installing = true;
      this.error = '';

      const response = await installGalleryPreview(this.tab.id);

      this.installing = false;

      if (!response.ok) {
        this.error = galleryErrorText(response);
        return;
      }

      // Installing ended the preview, and the new profile is applied.
      this.previewId = null;
      this.$emit('preview', false);
      this.styles = this.styles.filter(each => each.id !== style.id);
      this.$emit('installed');
    },
  },
});
</script>

<style lang="scss" scoped>
.gallery {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 6px 6px;
}

.gallery-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 6px;
}

.gallery-heading .browse {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    color: var(--accent-text);
  }

  @include focus-ring(2px);
}
</style>
