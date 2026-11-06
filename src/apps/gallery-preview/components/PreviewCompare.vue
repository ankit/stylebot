<template>
  <s-tooltip :text="t('switch_view')" shortcut="c">
    <s-segmented-control
      fit
      size="medium"
      aria-keyshortcuts="C"
      :aria-label="t('compare_with_the_original')"
      :value="original ? 'original' : 'styled'"
      :options="segments"
      :disabled="disabled"
      @change="$emit('change', $event === 'original')"
    />
  </s-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import { SSegmentedControl, STooltip } from '@stylebot/components';

import { isBareKey } from '../keys';

const KEY = 'KeyC';
const HOLD_MS = 250;

/**
 * Switches the page between its original look and the previewed style, by
 * its segments or C anywhere on the page: a tap switches, a hold peeks and
 * goes back on release. Emits `change` with whether the original shows.
 */
export default Vue.extend({
  name: 'PreviewCompare',

  components: {
    SSegmentedControl,
    STooltip,
  },

  props: {
    original: {
      type: Boolean,
      default: false,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      pressedAt: 0,
    };
  },

  computed: {
    segments(): Array<{ value: string; label: string }> {
      return [
        { value: 'original', label: this.t('original') },
        { value: 'styled', label: this.t('styled') },
      ];
    },
  },

  mounted() {
    // Captured, so the page's own shortcut for C doesn't run as well.
    window.addEventListener('keydown', this.onKeydown, true);
    window.addEventListener('keyup', this.onKeyup, true);
    window.addEventListener('blur', this.onBlur);
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown, true);
    window.removeEventListener('keyup', this.onKeyup, true);
    window.removeEventListener('blur', this.onBlur);
  },

  methods: {
    onKeydown(event: KeyboardEvent): void {
      if (this.disabled || !isBareKey(event, KEY)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      if (!this.pressedAt) {
        this.pressedAt = Date.now();
        this.$emit('change', !this.original);
      }
    },

    onKeyup(event: KeyboardEvent): void {
      if (event.code !== KEY || !this.pressedAt) {
        return;
      }

      const held = Date.now() - this.pressedAt >= HOLD_MS;

      event.stopImmediatePropagation();
      this.pressedAt = 0;

      if (held) {
        this.$emit('change', !this.original);
      }
    },

    onBlur(): void {
      if (this.pressedAt) {
        this.pressedAt = 0;
        this.$emit('change', !this.original);
      }
    },
  },
});
</script>
