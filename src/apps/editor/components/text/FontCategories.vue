<template>
  <div class="font-categories-bar">
    <div class="font-categories">
      <!-- One stop in the menu's Up/Down order, the rest marked secondary;
           Left and Right move along. A click keeps focus in the field. -->
      <button
        v-for="(option, index) in options"
        :key="option.key"
        ref="buttons"
        type="button"
        class="font-category"
        :class="{ active: option.value === active }"
        tabindex="-1"
        :aria-pressed="String(option.value === active)"
        :data-menu-secondary="option.value === active ? undefined : ''"
        @mousedown.prevent
        @click="$emit('browse', option.value)"
        @keydown.left.prevent="move(index, -1)"
        @keydown.right.prevent="move(index, 1)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';

import type { GoogleFontCategory } from '@stylebot/google-fonts';

/**
 * The Google Fonts categories the font picker lists in full, as a strip of
 * buttons led by All (null), so one is always picked. Emits `browse` with
 * the clicked one. The arrow keys reach it as one stop, at the picked one.
 */
export default Vue.extend({
  name: 'FontCategories',

  props: {
    active: {
      type: String as PropType<GoogleFontCategory | null>,
      default: null,
    },
  },

  computed: {
    options(): Array<{
      key: string;
      value: GoogleFontCategory | null;
      label: string;
    }> {
      return [
        { key: 'all', value: null, label: this.t('all') },
        { key: 'sans-serif', value: 'sans-serif', label: this.t('sans') },
        { key: 'serif', value: 'serif', label: this.t('serif') },
        { key: 'monospace', value: 'monospace', label: this.t('mono') },
        { key: 'handwriting', value: 'handwriting', label: this.t('script') },
      ];
    },
  },

  methods: {
    move(index: number, delta: number): void {
      const buttons = this.$refs.buttons as Array<HTMLElement>;
      buttons[(index + delta + buttons.length) % buttons.length].focus();
    },
  },
});
</script>

<style lang="scss" scoped>
.font-categories-bar {
  position: sticky;
  top: calc(-1 * var(--menu-padding, 0px));
  z-index: 1;
  margin-top: calc(-1 * var(--menu-padding, 0px));
  padding: calc(4px + var(--menu-padding, 0px)) 4px 4px;
  background: var(--menu-surface);
}

.font-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px;
  border-radius: 7px;
  background: var(--field-surface);
}

.font-category {
  @include button-reset;

  flex: 1 1 auto;
  height: 24px;
  padding: 0 4px;
  border-radius: 5px;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;

  &.active {
    background: var(--field-surface-active);
    box-shadow: 0 1px 2px rgb(0 0 0 / 18%), 0 0 0 1px rgb(0 0 0 / 6%);
    color: var(--text-primary);
  }

  @include hover-capable {
    &:not(.active):hover {
      background: color-mix(in srgb, var(--text-primary) 6%, transparent);
      color: var(--text-primary);
    }
  }

  @include focus-ring;

  .keyboard-nav &:focus {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
}
</style>
