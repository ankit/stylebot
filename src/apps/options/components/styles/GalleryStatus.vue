<template>
  <div class="gallery-status">
    <template v-if="!listing.published">
      <span
        v-if="labelText"
        :title="edited ? t('edited_styles_dont_get_gallery_updates') : null"
      >
        {{ labelText }}
      </span>
      <span v-if="labelText" class="dot">·</span>
      <a class="action" :href="viewUrl" target="_blank" rel="noopener">
        {{ t('view_in_gallery') }}
      </a>
    </template>

    <template v-else-if="edited">
      <s-status-dot tone="warning" :size="6" />
      <span>{{ t('unpublished_changes') }}</span>
      <span class="dot">·</span>
      <button type="button" class="action" @click="publish">
        {{ t('publish') }}
      </button>
    </template>

    <template v-else>
      <span>{{ t('published') }}</span>
      <span class="dot">·</span>
      <a class="action" :href="manageUrl" target="_blank" rel="noopener">
        {{ t('manage') }}
      </a>
    </template>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SStatusDot } from '@stylebot/components';
import {
  getGalleryEditUrl,
  getGalleryStyleUrl,
  hashCss,
} from '@stylebot/gallery';
import type { GalleryListing } from '@stylebot/types';

import { getGalleryStyle, publishProfileToGallery } from '../../utils';

/**
 * A profile's Gallery state above its code: installed, edited since it was
 * installed, published, or with changes to publish.
 */
export default Vue.extend({
  name: 'GalleryStatus',

  components: {
    SStatusDot,
  },

  props: {
    listing: {
      type: Object as PropType<GalleryListing>,
      required: true,
    },

    // The profile's saved css, to tell if it was edited or has changes to publish.
    css: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    profileId: {
      type: String,
      required: true,
    },
  },

  data(): { author: string; authorLoaded: boolean } {
    return {
      author: '',
      authorLoaded: false,
    };
  },

  computed: {
    edited(): boolean {
      return hashCss(this.css) !== this.listing.cssHash;
    },

    // What an install is, once its author is known.
    labelText(): string {
      if (!this.authorLoaded) {
        return '';
      }

      if (this.edited) {
        return this.author
          ? this.t('your_edit_of_authors_style', [this.author])
          : this.t('your_edit_of_a_gallery_style');
      }

      return this.author
        ? this.t('gallery_style_by_author', [this.author])
        : this.t('gallery_style');
    },

    viewUrl(): string {
      const { styleId, slug } = this.listing;

      return getGalleryStyleUrl({ id: styleId, slug });
    },

    manageUrl(): string {
      return getGalleryEditUrl(this.listing.styleId);
    },
  },

  watch: {
    'listing.styleId': {
      immediate: true,

      async handler(styleId: number): Promise<void> {
        this.author = '';
        this.authorLoaded = false;

        if (this.listing.published) {
          return;
        }

        const response = await getGalleryStyle(styleId);

        // Another profile may have been picked while this one loaded.
        if (this.listing.styleId !== styleId) {
          return;
        }

        if (response?.ok) {
          this.author = response.style.author.username;
        }

        this.authorLoaded = true;
      },
    },
  },

  methods: {
    publish(): void {
      publishProfileToGallery(this.url, this.profileId);
    },
  },
});
</script>

<style lang="scss" scoped>
.gallery-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-bottom: 1px solid var(--panel-border);
  background: var(--inset-surface);
  font-size: 13px;
  line-height: 1;
  color: var(--text-muted);
}

.dot {
  color: var(--text-faint);
}

.action {
  @include button-reset;

  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring(2px);
}
</style>
