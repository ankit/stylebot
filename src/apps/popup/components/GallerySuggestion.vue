<template>
  <div class="suggestion" :class="{ previewing }">
    <s-tooltip grow :text="details" :disabled="disabled">
      <button
        type="button"
        class="pick"
        :disabled="disabled"
        :aria-pressed="previewing ? 'true' : 'false'"
        @click="$emit('preview')"
      >
        <s-text as="span" size="large" class="name">
          {{ styleData.name }}
        </s-text>
        <s-text
          v-if="previewing"
          as="span"
          size="caption"
          variant="muted"
          class="status"
        >
          <eye-icon
            class="status-previewing"
            role="img"
            :size="14"
            :aria-label="t('previewing')"
          />
          <span class="status-stop">{{ t('stop') }}</span>
        </s-text>
        <s-text
          v-else-if="styleData.installs"
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
import { DownloadIcon, EyeIcon } from '@stylebot/icons';
import { getGalleryByline } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

/**
 * A suggested gallery style, with its installs, as a button that emits
 * `preview`, on a click either to start or stop one, labelled while it
 * previews, as Stop once that's what a click does. Its tooltip has the author and exact installs.
 */
export default Vue.extend({
  name: 'GallerySuggestion',

  components: {
    DownloadIcon,
    EyeIcon,
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

  .previewing & {
    font-weight: 600;
  }
}

.status {
  display: grid;
  flex: none;
  align-items: center;
  justify-items: end;
}

.status-previewing,
.status-stop {
  grid-area: 1 / 1;
}

.status-stop {
  visibility: hidden;
  color: var(--text-primary);
  font-size: 13px;
}

@mixin show-stop {
  .status-previewing {
    visibility: hidden;
  }

  .status-stop {
    visibility: visible;
  }
}

@include hover-capable {
  .pick:hover:not(:disabled) {
    @include show-stop;
  }
}

.pick:focus-visible {
  @include show-stop;
}

@include touch {
  .pick:not(:disabled) {
    @include show-stop;
  }
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

  @include hover-capable {
    &:hover {
      background: var(--hover-tint);
    }
  }
}

.pick {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: var(--popup-row-height, 36px);
  padding: 8px 10px;
  border-radius: 8px;
  color: inherit;
  text-align: start;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }

  @include focus-ring;
}
</style>
