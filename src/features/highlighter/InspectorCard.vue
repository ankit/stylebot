<template>
  <div class="inspect-card" :style="{ top: `${top}px`, left: `${left}px` }">
    <svg
      v-if="placement"
      class="arrow"
      :class="placement"
      viewBox="0 0 14 8"
      width="14"
      height="8"
      aria-hidden="true"
    >
      <path d="M0 8 7 1 14 8z" />
    </svg>

    <s-text as="span" size="label" class="selector">
      {{ selectorText }}
    </s-text>
    <s-count-badge v-if="ruleCount > 0" :count="ruleCount">
      {{ ruleCountLabel }}
    </s-count-badge>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SCountBadge, SText } from '@stylebot/components';
import { splitSelectorList } from '@stylebot/css';

/**
 * Mounted by OverlayTip (Overlay.ts) into the editor's theme-provider subtree,
 * which is what gives it the editor's CSS variables and fonts over the page.
 * Says what a click would select; the panel previews the element in full.
 */
export default Vue.extend({
  name: 'InspectorCard',

  components: {
    SCountBadge,
    SText,
  },

  data(): {
    name: string;
    ruleCount: number;
    top: number;
    left: number;
    placement: 'above' | 'below' | null;
  } {
    return {
      name: '',
      ruleCount: 0,
      top: 0,
      left: 0,
      placement: null,
    };
  },

  computed: {
    selectorText(): string {
      return splitSelectorList(this.name).join(', ');
    },

    ruleCountLabel(): string {
      return this.t(
        this.ruleCount === 1 ? 'rules_count_one' : 'rules_count_other',
        [String(this.ruleCount)]
      );
    },
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
  max-width: 320px;
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
  left: 12px;
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

.selector {
  min-width: 0;
  overflow-wrap: anywhere;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--field-ink);
}
</style>
