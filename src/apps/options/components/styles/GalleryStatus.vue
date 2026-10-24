<template>
  <div class="gallery-status">
    <template v-if="!listing.published">
      <span v-if="author">{{ t('by_author', [author]) }}</span>
      <span v-if="author" class="dot">·</span>
      <a class="action" :href="viewUrl" target="_blank" rel="noopener">
        {{ t('view_in_gallery') }}
      </a>
    </template>

    <template v-else-if="hasChanges">
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
 * A profile's Gallery state above its code: installed, published, or with
 * changes to publish.
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

    // The profile's saved css, to tell if it has changes to publish.
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

  data(): { author: string } {
    return {
      author: '',
    };
  },

  computed: {
    hasChanges(): boolean {
      return hashCss(this.css) !== this.listing.cssHash;
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

        if (this.listing.published) {
          return;
        }

        const response = await getGalleryStyle(styleId);

        // Another profile may have been picked while this one loaded.
        if (response?.ok && this.listing.styleId === styleId) {
          this.author = response.style.author.username;
        }
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
