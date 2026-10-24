<template>
  <div v-if="published || installed" class="gallery-status">
    <template v-if="!published && !edited">
      <span class="state">{{ installedText }}</span>
      <a class="link" :href="viewUrl" target="_blank" rel="noopener">
        {{ t('view') }}
      </a>
    </template>

    <template v-else-if="!published">
      <s-tooltip
        :text="resetError || t('edited_styles_dont_get_gallery_updates')"
        placement="top"
        grow
      >
        <span class="state">
          <span class="text">{{ resetError || editedText }}</span>
        </span>
      </s-tooltip>
      <span class="actions">
        <a class="link" :href="viewUrl" target="_blank" rel="noopener">
          {{ t('view') }}
        </a>
        <s-tooltip :text="t('use_gallery_version')" placement="top">
          <button
            type="button"
            class="link"
            :aria-label="t('use_gallery_version')"
            :disabled="resetting"
            @click="reset"
          >
            {{ t('revert') }}
          </button>
        </s-tooltip>
      </span>
    </template>

    <template v-else-if="!hasChanges">
      <span class="state">{{ t('published') }}</span>
      <a class="link" :href="manageUrl" target="_blank" rel="noopener">
        {{ t('manage') }}
      </a>
    </template>

    <template v-else>
      <span class="state">
        <s-status-dot tone="warning" :size="8" />
        {{ t('unpublished_changes') }}
      </span>
      <s-button size="small" :disabled="publishing" @click="publish">
        {{ t('publish') }}
      </s-button>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, SStatusDot, STooltip } from '@stylebot/components';
import {
  galleryErrorText,
  getGalleryEditUrl,
  getGalleryStyleUrl,
} from '@stylebot/gallery';
import type {
  GalleryInstalled,
  GalleryPublished,
  ResetGalleryProfileResponse,
} from '@stylebot/types';

import { getGalleryStyle } from '../../utils/gallery';

/**
 * The profile's Gallery state under the editor: installed, edited since it
 * was installed, published, or with changes to publish.
 */
export default Vue.extend({
  name: 'TheGalleryStatus',

  components: {
    SButton,
    SStatusDot,
    STooltip,
  },

  data(): {
    author: string;
    authorLoaded: boolean;
    resetting: boolean;
    resetError: string;
  } {
    return {
      author: '',
      authorLoaded: false,
      resetting: false,
      resetError: '',
    };
  },

  computed: {
    published(): GalleryPublished | null {
      return this.$store.state.publishedGalleryStyle;
    },

    installed(): GalleryInstalled | null {
      return this.$store.state.installedGalleryStyle;
    },

    installedId(): number | null {
      return this.installed?.id ?? null;
    },

    edited(): boolean {
      return this.$store.getters.hasChangesSinceInstall;
    },

    editedText(): string {
      if (!this.authorLoaded) {
        return '';
      }

      return this.author
        ? this.t('your_edit_of_authors_style', [this.author])
        : this.t('your_edit_of_a_gallery_style');
    },

    installedText(): string {
      if (!this.authorLoaded) {
        return '';
      }

      return this.author
        ? this.t('gallery_style_by_author', [this.author])
        : this.t('gallery_style');
    },

    viewUrl(): string {
      return this.installed ? getGalleryStyleUrl(this.installed) : '';
    },

    publishing(): boolean {
      return this.$store.state.publishing;
    },

    hasChanges(): boolean {
      return this.$store.getters.hasUnpublishedChanges;
    },

    manageUrl(): string {
      return this.published ? getGalleryEditUrl(this.published.styleId) : '';
    },
  },

  watch: {
    // By id, since every listing reload brings a new installed object.
    installedId: {
      immediate: true,

      async handler(id: number | null): Promise<void> {
        this.resetError = '';
        this.author = '';
        this.authorLoaded = id === null;

        if (id === null) {
          return;
        }

        const response = await getGalleryStyle(id);

        // Another profile may have been picked while this one loaded.
        if (this.installedId !== id) {
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
      this.$store.dispatch('publishToGallery');
    },

    async reset(): Promise<void> {
      this.resetting = true;
      this.resetError = '';

      try {
        const response: ResetGalleryProfileResponse =
          await this.$store.dispatch('resetToGalleryVersion');

        if (!response.ok) {
          this.resetError = galleryErrorText(response);
        }
      } finally {
        this.resetting = false;
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.gallery-status {
  flex: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 40px;
  padding: 0 var(--panel-gutter);
  border-top: 1px solid var(--panel-border);
}

.state {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  line-height: 1;
  color: var(--text-muted);
}

.text {
  @include truncate;
}

.actions {
  display: flex;
  flex: none;
  align-items: center;
  margin-right: -8px;

  .link {
    margin-right: 0;
  }
}

.link {
  @include button-reset;

  display: inline-flex;
  flex: none;
  align-items: center;
  height: 28px;
  margin-right: -8px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @include focus-ring(2px);
}

.gallery-status .button.size-small {
  flex: none;
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 500;
}
</style>
