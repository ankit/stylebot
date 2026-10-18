<template>
  <button
    type="button"
    class="suggestion"
    :disabled="disabled"
    @click="$emit('preview')"
  >
    <gallery-style-summary :style-data="styleData">
      <s-text as="span" size="caption" variant="muted" class="meta">
        <span class="author">{{ author }}</span>
        <span v-if="styleData.installs" class="installs" :title="installsTitle">
          <download-icon :size="11" />
          {{ installsCount }}
        </span>
      </s-text>
    </gallery-style-summary>
    <span class="preview-icon">
      <eye-icon :size="16" role="img" :aria-label="t('preview')" />
    </span>
  </button>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SText } from '@stylebot/components';
import { DownloadIcon, EyeIcon } from '@stylebot/icons';
import type { GalleryStyle } from '@stylebot/types';

import GalleryStyleSummary from './GalleryStyleSummary.vue';

/**
 * A suggested gallery style, with its author and installs, as a button that
 * emits `preview`.
 */
export default Vue.extend({
  name: 'GallerySuggestion',

  components: {
    DownloadIcon,
    EyeIcon,
    GalleryStyleSummary,
    SText,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryStyle>,
      required: true,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    // Authors without an alias are anonymous, as the publish form puts it.
    author(): string {
      return this.styleData.author.name || this.t('anonymous');
    },

    // Short, as in 1.2K; the title has the whole number.
    installsCount(): string {
      return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(
        this.styleData.installs
      );
    },

    installsTitle(): string {
      const { installs } = this.styleData;

      return this.t(installs === 1 ? 'installs_one' : 'installs_other', [
        installs.toLocaleString(),
      ]);
    },
  },
});
</script>

<style lang="scss" scoped>
.meta {
  @include truncate;

  display: flex;
  align-items: center;
  gap: 12px;
}

.author {
  @include truncate;
}

.installs {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.suggestion {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  color: inherit;
  text-align: start;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--hover-tint);
  }

  &:disabled {
    cursor: default;
  }

  @include focus-ring;
}

.preview-icon {
  display: flex;
  flex: none;
  max-width: 0;
  margin-left: -12px;
  overflow: hidden;
  color: var(--text-muted);
  opacity: 0;
}

.suggestion:hover:not(:disabled) .preview-icon,
.suggestion:focus-visible .preview-icon {
  max-width: none;
  margin-left: 0;
  opacity: 1;
}
</style>
