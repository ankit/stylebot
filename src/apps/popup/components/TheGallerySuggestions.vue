<template>
  <div v-if="shownStyles.length">
    <div class="popup-divider" />

    <section class="gallery">
      <div class="gallery-heading">
        <s-text as="h2" size="caption" variant="muted" medium>
          {{ t('popular_in_gallery') }}
        </s-text>
        <s-external-link
          v-if="browseUrl"
          class="browse"
          :href="browseUrl"
          :underline="false"
        >
          {{ t('browse_all') }}
        </s-external-link>
      </div>

      <template v-for="style in shownStyles">
        <gallery-preview-card
          v-if="style.id === previewId"
          :key="style.id"
          :style-data="style"
          :installing="installing"
          @install="install(style)"
          @cancel="cancel"
        />
        <gallery-suggestion
          v-else
          :key="style.id"
          :style-data="style"
          :disabled="installing"
          @preview="preview(style)"
        />
      </template>

      <s-callout v-if="error" tone="danger">{{ error }}</s-callout>
    </section>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SCallout, SExternalLink, SText } from '@stylebot/components';
import {
  GALLERY_PREVIEW_PORT,
  galleryErrorText,
  getGallerySiteUrl,
  type GalleryPreviewMessage,
} from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

import GalleryPreviewCard from './GalleryPreviewCard.vue';
import GallerySuggestion from './GallerySuggestion.vue';
import {
  getGalleryStyleCss,
  getGallerySuggestions,
  installGalleryStyle,
} from '../utils';

const SHOWN = 2;

type Data = {
  styles: Array<GalleryStyle>;
  group: string | null;
  previewId: string | null;
  installing: boolean;
  error: string;
  port: chrome.runtime.Port | null;
};

/**
 * The site's most installed gallery styles. Clicking one previews it on the
 * page in place of the site's own style, until it's installed as a new
 * profile, cancelled, or the popup closes.
 */
export default Vue.extend({
  name: 'TheGallerySuggestions',

  components: {
    GalleryPreviewCard,
    GallerySuggestion,
    SCallout,
    SExternalLink,
    SText,
  },

  props: {
    tab: {
      type: Object as PropType<chrome.tabs.Tab>,
      required: true,
    },

    // The Stylebot style an install adds a profile to.
    styleUrl: {
      type: String,
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
      group: null,
      previewId: null,
      installing: false,
      error: '',
      port: null,
    };
  },

  computed: {
    browseUrl(): string {
      return this.group ? getGallerySiteUrl(this.group) : '';
    },

    shownStyles(): Array<GalleryStyle> {
      const names = new Set(
        this.profileNames.map(name => name.trim().toLowerCase())
      );

      return this.styles
        .filter(style => !names.has(style.name.trim().toLowerCase()))
        .slice(0, SHOWN);
    },
  },

  async mounted() {
    const response = await getGallerySuggestions(this.tab.url ?? '');

    // A gallery that can't be reached leaves the popup as it always was.
    if (response?.ok) {
      this.styles = response.styles;
      this.group = response.group;
    }
  },

  beforeDestroy() {
    this.port?.disconnect();
  },

  methods: {
    send(message: GalleryPreviewMessage): void {
      if (!this.port && this.tab.id !== undefined) {
        this.port = chrome.tabs.connect(this.tab.id, {
          name: GALLERY_PREVIEW_PORT,
        });
      }

      this.port?.postMessage(message);
    },

    async preview(style: GalleryStyle): Promise<void> {
      this.error = '';
      this.previewId = style.id;
      this.$emit('preview', true);

      const response = await getGalleryStyleCss(style.id);

      // Another style may have been picked while this one loaded.
      if (this.previewId !== style.id) {
        return;
      }

      if (response.ok) {
        this.send({
          preview: { css: response.css, importUrls: response.importUrls },
        });
      } else {
        this.error = galleryErrorText(response);
        this.cancel();
      }
    },

    /**
     * Puts the page back as it was; the popup also calls it when a profile
     * is picked.
     */
    cancel(): void {
      if (this.previewId) {
        this.send({ preview: null });
      }

      this.previewId = null;
      this.$emit('preview', false);
    },

    async install(style: GalleryStyle): Promise<void> {
      this.installing = true;
      this.error = '';

      const response = await installGalleryStyle({
        id: style.id,
        url: this.styleUrl,
        group: style.group,
        slug: style.slug,
      });

      this.installing = false;

      if (!response.ok) {
        this.error = galleryErrorText(response);
        return;
      }

      // The installed profile is applied now; the preview just steps aside.
      this.cancel();
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
  font-size: 12px;
}
</style>
