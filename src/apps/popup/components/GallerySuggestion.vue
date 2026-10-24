<template>
  <div class="suggestion" :class="{ previewing }">
    <s-tooltip grow :text="details" :disabled="disabled">
      <button
        type="button"
        class="pick"
        :disabled="disabled"
        :aria-pressed="previewing ? 'true' : 'false'"
        @click="!previewing && $emit('preview')"
      >
        <s-text as="span" size="large" class="name">
          {{ styleData.name }}
        </s-text>
        <s-text
          v-if="styleData.installs"
          as="span"
          size="caption"
          variant="muted"
          class="installs"
        >
          <download-icon :size="11" />
          {{ installsCount }}
        </s-text>
      </button>
    </s-tooltip>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SText, STooltip } from '@stylebot/components';
import { DownloadIcon } from '@stylebot/icons';
import { getGalleryByline } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

/**
 * A suggested gallery style, with its installs, as a button that emits
 * `preview`, highlighted while it previews. Its tooltip has the author and
 * exact installs.
 */
export default Vue.extend({
  name: 'GallerySuggestion',

  components: {
    DownloadIcon,
    SText,
    STooltip,
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

    previewing: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    // Short, as in 1.2K; the title has the whole number.
    installsCount(): string {
      return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(
        this.styleData.installs
      );
    },

    details(): string {
      return getGalleryByline(this.styleData);
    },
  },
});
</script>

<style lang="scss" scoped>
.name {
  @include truncate;

  flex: 1;
  min-width: 0;
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
  border-radius: 8px;

  &:hover:not(.previewing) {
    background: var(--hover-tint);
  }

  &.previewing {
    margin: 0 -6px;
    padding: 0 6px;
    border-radius: 0;
    background: var(--hover-tint);
  }
}

.pick {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 36px;
  padding: 8px 10px;
  border-radius: 8px;
  color: inherit;
  text-align: start;
  cursor: pointer;

  .previewing &,
  &:disabled {
    cursor: default;
  }

  @include focus-ring;
}
</style>
