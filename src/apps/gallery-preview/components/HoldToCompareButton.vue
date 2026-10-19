<template>
  <s-button
    class="compare"
    :class="{ held }"
    :disabled="disabled"
    @pointerdown.native="hold($event)"
    @pointerup.native="release"
    @pointercancel.native="release"
    @lostpointercapture.native="release"
    @blur.native="release"
    @keydown.native.space.prevent="setHeld(true)"
    @keydown.native.enter.prevent="setHeld(true)"
    @keyup.native="release"
  >
    {{ t('hold_to_compare') }}
  </s-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton } from '@stylebot/components';

/**
 * A button held down by pointer, Space or Enter, emitting `change` as it's
 * held and let go.
 */
export default Vue.extend({
  name: 'HoldToCompareButton',

  components: {
    SButton,
  },

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      held: false,
    };
  },

  beforeDestroy() {
    this.setHeld(false);
  },

  methods: {
    setHeld(held: boolean): void {
      if (this.held !== held) {
        this.held = held;
        this.$emit('change', held);
      }
    },

    hold(event: PointerEvent): void {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.setHeld(true);
    },

    release(): void {
      this.setHeld(false);
    },
  },
});
</script>

<style lang="scss" scoped>
.compare {
  touch-action: none;
  user-select: none;
}

.button.compare.held,
.button.compare.held:hover:not(:disabled) {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  color: var(--accent);
}
</style>
