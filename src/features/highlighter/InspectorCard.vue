<template>
  <div class="inspect-card" :style="{ top: `${top}px`, left: `${left}px` }">
    <svg
      v-if="placement"
      class="arrow"
      :class="placement"
      :style="{ left: `${arrowLeft}px` }"
      viewBox="0 0 14 8"
      width="14"
      height="8"
      aria-hidden="true"
    >
      <path d="M0 8 7 1 14 8z" />
    </svg>

    <s-text as="span" size="label" class="name">
      <!-- prettier-ignore -->
      <span v-for="(part, index) in nameParts" :key="index" class="part">{{ part }}</span>
    </s-text>
    <s-text v-if="size" as="span" size="label" class="size">
      {{ size }}
    </s-text>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SText } from '@stylebot/components';

/**
 * Mounted by OverlayTip (Overlay.ts) into the editor's theme-provider subtree,
 * which is what gives it the editor's CSS variables and fonts over the page.
 * Names the element under the pointer, as dev tools do; the panel previews
 * it in full.
 */
export default Vue.extend({
  name: 'InspectorCard',

  components: {
    SText,
  },

  data(): {
    nameParts: Array<string>;
    size: string;
    top: number;
    left: number;
    arrowLeft: number;
    placement: 'above' | 'below' | null;
  } {
    return {
      nameParts: [],
      size: '',
      top: 0,
      left: 0,
      arrowLeft: 12,
      placement: null,
    };
  },
});
</script>

<style lang="scss" scoped>
.inspect-card {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  max-width: min(480px, calc(100vw - 16px));
  min-height: 17px;
  --card-edge: color-mix(in srgb, var(--text-primary) 18%, var(--menu-surface));

  padding: 8px 12px;
  border-radius: 8px;
  background: var(--menu-surface);
  filter: drop-shadow(0 1px 0 var(--card-edge))
    drop-shadow(0 -1px 0 var(--card-edge)) drop-shadow(1px 0 0 var(--card-edge))
    drop-shadow(-1px 0 0 var(--card-edge))
    drop-shadow(0 4px 12px rgb(0 0 0 / 14%));
  pointer-events: none;
}

.arrow {
  position: absolute;
  fill: var(--menu-surface);
  pointer-events: none;

  &.below {
    top: -7px;
  }

  &.above {
    bottom: -7px;
    transform: rotate(180deg);
  }
}

.name {
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 16px;
  color: var(--field-ink);
}

.part {
  display: inline-block;
  max-width: 100%;
  font-family: inherit;
  overflow-wrap: anywhere;
}

.size {
  flex-shrink: 0;
  text-box: trim-both cap alphabetic;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
