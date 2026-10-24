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
          v-if="styleData.installs && !previewing"
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

    <s-button
      v-if="previewing"
      size="small"
      class="install"
      :disabled="disabled"
      :aria-busy="disabled ? 'true' : undefined"
      @click="$emit('install')"
    >
      {{ t('install') }}
    </s-button>
    <s-icon-button
      v-if="previewing"
      :size="28"
      :tooltip="t('stop_preview')"
      class="stop"
      :disabled="disabled"
      @click="$emit('cancel')"
    >
      <x-icon :size="16" />
    </s-icon-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SButton, SIconButton, SText, STooltip } from '@stylebot/components';
import { DownloadIcon, XIcon } from '@stylebot/icons';
import { getGalleryByline } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

/**
 * A suggested gallery style, with its installs, as a button that emits
 * `preview`; while it previews, Install emits `install` and × `cancel`. Its
 * tooltip has the author and exact installs.
 */
export default Vue.extend({
  name: 'GallerySuggestion',

  components: {
    DownloadIcon,
    SButton,
    SIconButton,
    SText,
    STooltip,
    XIcon,
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
  gap: 8px;
  border-radius: 8px;

  &:hover:not(.previewing),
  &.previewing {
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

.install {
  flex: none;
}

.stop {
  flex: none;
  margin-right: 6px;

  ::v-deep .icon-button {
    color: var(--text-muted);

    &:hover:not(:disabled) {
      color: var(--text-primary);
      background: var(--panel-border);
    }
  }
}

.suggestion .install.button:hover:not(:disabled) {
  background: var(--inset-button-hover);
  border-color: var(--inset-button-hover-border);
  box-shadow: var(--inset-button-hover-shadow);
}
</style>
