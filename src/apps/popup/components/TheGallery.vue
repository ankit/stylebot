<template>
  <gallery-browser
    v-if="browsing"
    :styles="styles"
    :browse-url="browseUrl"
    :preview-id="previewId"
    :loading="loadingId !== null"
    :installing="installing"
    :error="error"
    @back="back"
    @preview="preview"
  />

  <div v-else-if="compact && styles.length">
    <div class="popup-divider" />

    <section class="gallery gallery--compact">
      <gallery-link :count="styles.length" @click="$emit('browse', true)">
        {{ t('styles_in_gallery') }}
      </gallery-link>

      <s-callout v-if="error" tone="danger">{{ error }}</s-callout>
    </section>
  </div>

  <div v-else-if="!compact && shownStyles.length">
    <div class="popup-divider" />

    <section class="gallery">
      <s-text
        as="h2"
        size="caption"
        variant="muted"
        medium
        class="gallery-heading"
      >
        {{ t('styles_in_gallery') }}
      </s-text>

      <gallery-suggestion
        v-for="style in shownStyles"
        :key="style.id"
        :style-data="style"
        :previewing="style.id === previewId"
        :disabled="installing"
        @preview="preview(style)"
      />

      <gallery-link
        v-if="canBrowse"
        :count="styles.length"
        @click="$emit('browse', true)"
      >
        {{ t('browse_all') }}
      </gallery-link>
      <gallery-link v-else-if="browseUrl" :href="browseUrl">
        {{ t('open_gallery') }}
      </gallery-link>

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

import GalleryBrowser from './GalleryBrowser.vue';
import GalleryLink from './GalleryLink.vue';
import GallerySuggestion from './GallerySuggestion.vue';
import {
  endGalleryPreview,
  getGalleryPreview,
  getGallerySuggestions,
  installGalleryPreview,
  previewGalleryStyle,
} from '../utils';

const SHOWN = 3;

type Data = {
  styles: Array<GalleryStyle>;
  site: string | null;
  previewId: number | null;
  // The picked style, until the tab has it. Stopping sooner would leave it on.
  loadingId: number | null;
  installing: boolean;
  error: string;
};

/**
 * The site's most installed gallery styles. Clicking one previews it on the
 * tab in place of the site's own style, as the tab moves around the site,
 * until it's installed as a new profile or cancelled, from the popup's
 * footer or on the page.
 */
export default Vue.extend({
  name: 'TheGallery',

  components: {
    GalleryBrowser,
    GalleryLink,
    GallerySuggestion,
    SCallout,
    SText,
  },

  props: {
    tab: {
      type: Object as PropType<chrome.tabs.Tab>,
      required: true,
    },

    // Just a row into the site's styles, for a site already styled.
    compact: Boolean,

    // Every style there is to try, in place of the rest of the popup.
    browsing: Boolean,
  },

  data(): Data {
    return {
      styles: [],
      site: null,
      previewId: null,
      loadingId: null,
      installing: false,
      error: '',
    };
  },

  computed: {
    // Installed and published styles aren't listed, so there may be none
    // left to try, or no more than the popup already shows.
    canBrowse(): boolean {
      return this.compact ? this.styles.length > 0 : this.styles.length > SHOWN;
    },

    browseUrl(): string {
      return this.site ? getGallerySiteUrl(this.site) : '';
    },

    previewed(): GalleryStyle | null {
      return this.styles.find(style => style.id === this.previewId) ?? null;
    },

    shownStyles(): Array<GalleryStyle> {
      const shown = this.styles.slice(0, SHOWN);
      const { previewed } = this;

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
      this.$emit('preview', preview.style.name);

      if (this.canBrowse) {
        this.$emit('browse', true);
      }
    }
  },

  methods: {
    /**
     * Returns to the rest of the popup, leaving no preview behind.
     */
    back(): void {
      this.cancel();
      this.$emit('browse', false);
    },

    /**
     * Previews a style, or stops the preview of the one already picked.
     */
    async preview(style: GalleryStyle): Promise<void> {
      if (this.tab.id === undefined) {
        return;
      }

      if (style.id === this.previewId) {
        if (style.id !== this.loadingId) {
          this.cancel();
        }

        return;
      }

      this.error = '';
      this.previewId = style.id;
      this.loadingId = style.id;
      this.$emit('preview', style.name);

      const response = await previewGalleryStyle(this.tab.id, style.id);

      if (this.loadingId === style.id) {
        this.loadingId = null;
      }

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
      this.$emit('preview', null);
    },

    /**
     * Installs the previewed style as a new profile; the popup's footer
     * offers it while a style previews.
     */
    async install(): Promise<void> {
      const style = this.previewed;

      if (!style || this.tab.id === undefined) {
        return;
      }

      this.installing = true;
      this.$emit('installing', true);
      this.error = '';

      const response = await installGalleryPreview(this.tab.id);

      this.installing = false;
      this.$emit('installing', false);

      if (!response.ok) {
        this.error = galleryErrorText(response);
        return;
      }

      // Installing ended the preview, and the new profile is applied.
      this.previewId = null;
      this.$emit('preview', null);
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

  &.gallery--compact {
    padding: 6px;
  }
}

.gallery-heading {
  padding: 0 10px 6px;
}
</style>
