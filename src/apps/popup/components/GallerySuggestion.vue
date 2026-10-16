<template>
  <div class="suggestion" :class="{ disabled }" @click="preview">
    <gallery-style-summary :style-data="styleData">
      <s-text
        v-if="author || styleData.installs"
        as="span"
        size="caption"
        variant="muted"
        class="meta"
      >
        <span v-if="author" class="author">{{ author }}</span>
        <span v-if="styleData.installs" class="installs" :title="installsTitle">
          <download-icon :size="11" />
          {{ installsCount }}
        </span>
      </s-text>
    </gallery-style-summary>
    <s-button
      size="small"
      class="preview-button"
      :disabled="disabled"
      @click.stop="preview"
    >
      {{ t('preview') }}
    </s-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SButton, SText } from '@stylebot/components';
import { DownloadIcon } from '@stylebot/icons';
import type { GalleryStyle } from '@stylebot/types';

import GalleryStyleSummary from './GalleryStyleSummary.vue';

/**
 * A suggested gallery style, with its author and installs. Its Preview
 * button, or a click anywhere on it, emits `preview`.
 */
export default Vue.extend({
  name: 'GallerySuggestion',

  components: {
    DownloadIcon,
    GalleryStyleSummary,
    SButton,
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
    author(): string {
      return this.styleData.author.name ?? '';
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

  methods: {
    preview(): void {
      if (!this.disabled) {
        this.$emit('preview');
      }
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
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;

  &:hover:not(.disabled) {
    background: var(--hover-tint);
  }

  &.disabled {
    cursor: default;
  }
}

.suggestion .preview-button {
  flex: none;
  opacity: 0;
}

.suggestion .preview-button.button.default:hover:not(:disabled) {
  border-color: var(--text-faint);
  background: var(--panel-surface);
}

.suggestion:hover .preview-button,
.suggestion:focus-within .preview-button {
  opacity: 1;
}
</style>
