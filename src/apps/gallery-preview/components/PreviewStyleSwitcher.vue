<template>
  <div class="preview-style-switcher">
    <s-text as="span" variant="muted" class="count">
      {{ t('position_of_total_styles', [index + 1, total]) }}
    </s-text>
    <span class="arrows">
      <s-icon-button
        class="arrow"
        :size="28"
        :tooltip="t('previous_style')"
        tooltip-shortcut="["
        :aria-label="t('previous_style')"
        :disabled="disabled || index === 0"
        @click="switchTo(index - 1)"
      >
        <chevron-left-icon :size="14" />
      </s-icon-button>
      <s-icon-button
        class="arrow"
        :size="28"
        :tooltip="t('next_style')"
        tooltip-shortcut="]"
        :aria-label="t('next_style')"
        :disabled="disabled || index === total - 1"
        @click="switchTo(index + 1)"
      >
        <chevron-right-icon :size="14" />
      </s-icon-button>
    </span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SIconButton, SText } from '@stylebot/components';
import { ChevronLeftIcon, ChevronRightIcon } from '@stylebot/icons';

import { isBareKey } from '../keys';

const KEYS: Array<[string, number]> = [
  ['BracketLeft', -1],
  ['BracketRight', 1],
];

/**
 * Where a style sits among the site's, with arrows, or [ and ] anywhere on
 * the page, to the ones either side. Emits `switch` with the index to show.
 */
export default Vue.extend({
  name: 'PreviewStyleSwitcher',

  components: {
    ChevronLeftIcon,
    ChevronRightIcon,
    SIconButton,
    SText,
  },

  props: {
    index: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  mounted() {
    // Captured, so the page's own shortcuts for these don't run as well.
    window.addEventListener('keydown', this.onKeydown, true);
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown, true);
  },

  methods: {
    switchTo(index: number): void {
      if (!this.disabled && index >= 0 && index < this.total) {
        this.$emit('switch', index);
      }
    },

    onKeydown(event: KeyboardEvent): void {
      const [, step] = KEYS.find(([code]) => isBareKey(event, code)) ?? [];

      if (step) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.switchTo(this.index + step);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.preview-style-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 8px 0 16px;
  border-top: 1px solid var(--panel-border);
}

.count {
  font-size: 12.5px;
}

.arrows {
  display: flex;
  gap: 2px;
}

.arrow {
  color: var(--icon-color);
}
</style>
