<template>
  <div v-if="published || installed" class="gallery-status">
    <template v-if="!published">
      <span class="state">{{ installedText }}</span>
      <a class="link" :href="viewUrl" target="_blank" rel="noopener">
        {{ t('view') }}
      </a>
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
import { SButton, SStatusDot } from '@stylebot/components';
import { getGalleryEditUrl, getGalleryStyleUrl } from '@stylebot/gallery';
import type { GalleryPublished } from '@stylebot/types';

import { getGalleryStyle } from '../../utils/gallery';

type Installed = { id: number; slug: string };

/**
 * The profile's Gallery state under the editor: installed, published, or
 * with changes to publish.
 */
export default Vue.extend({
  name: 'TheGalleryStatus',

  components: {
    SButton,
    SStatusDot,
  },

  data(): { author: string } {
    return {
      author: '',
    };
  },

  computed: {
    published(): GalleryPublished | null {
      return this.$store.state.publishedGalleryStyle;
    },

    installed(): Installed | null {
      return this.$store.state.installedGalleryStyle;
    },

    installedText(): string {
      const from = this.t('from_gallery');

      return this.author
        ? `${from} · ${this.t('by_author', [this.author])}`
        : from;
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
    installed: {
      immediate: true,

      async handler(installed: Installed | null): Promise<void> {
        this.author = '';

        if (!installed) {
          return;
        }

        const response = await getGalleryStyle(installed.id);

        // Another profile may have been picked while this one loaded.
        if (response?.ok && this.installed?.id === installed.id) {
          this.author = response.style.author.username;
        }
      },
    },
  },

  methods: {
    publish(): void {
      this.$store.dispatch('publishToGallery');
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

.link {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: 28px;
  margin-right: -8px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;

  &:hover {
    color: var(--text-primary);
  }

  @include focus-ring(2px);
}

.gallery-status .button.size-small {
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 500;
}
</style>
