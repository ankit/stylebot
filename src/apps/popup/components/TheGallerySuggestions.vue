<template>
  <div v-if="compact && (previewed || total)">
    <div class="popup-divider" />

    <section class="gallery gallery--compact">
      <gallery-suggestion
        v-if="previewed"
        :style-data="previewed"
        previewing
        :disabled="installing"
      />
      <a
        v-else
        class="more"
        :href="browseUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="more-label">{{ t('styles_in_gallery') }}</span>
        <s-text as="span" size="large" variant="muted" class="more-count">
          {{ total }}
          <arrow-up-right-icon :size="14" />
        </s-text>
      </a>

      <s-callout v-if="error" tone="danger">{{ error }}</s-callout>
    </section>
  </div>

  <div v-else-if="!compact && shownStyles.length">
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
          <template v-if="shownStyles.length < total">
            {{ t('browse_all') }}
            <span class="browse-count">{{ total }}</span>
          </template>
          <template v-else>{{ t('open_gallery') }}</template>
        </a>
      </div>

      <gallery-suggestion
        v-for="style in shownStyles"
        :key="style.id"
        :style-data="style"
        :previewing="style.id === previewId"
        :disabled="installing"
        @preview="preview(style)"
      />

      <s-callout v-if="error" tone="danger">{{ error }}</s-callout>
    </section>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SCallout, SText } from '@stylebot/components';
import { ArrowUpRightIcon } from '@stylebot/icons';
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

const SHOWN = 3;

type Data = {
  styles: Array<GalleryStyle>;
  // How many the site has in the gallery, as its page there lists.
  total: number;
  site: string | null;
  previewId: number | null;
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
  name: 'TheGallerySuggestions',

  components: {
    ArrowUpRightIcon,
    GallerySuggestion,
    SCallout,
    SText,
  },

  props: {
    tab: {
      type: Object as PropType<chrome.tabs.Tab>,
      required: true,
    },

    // Just a link to the site's styles in the Gallery, for a site already
    // styled, or the row of a style the tab is previewing.
    compact: Boolean,
  },

  data(): Data {
    return {
      styles: [],
      total: 0,
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
      this.total = response.total;
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

  &.gallery--compact {
    padding: 6px;
  }
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

.browse-count {
  margin-left: 2px;
  font-variant-numeric: tabular-nums;
}

.more {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;

  &:hover {
    color: var(--text-primary);
    background: var(--hover-tint);
  }

  @include focus-ring;
}

.more-label {
  @include truncate;

  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.45;
}

.more-count {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}
</style>
