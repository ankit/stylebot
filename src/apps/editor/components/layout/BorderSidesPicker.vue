<template>
  <div
    class="border-sides"
    :class="{ unset }"
    role="group"
    :aria-label="t('sides')"
  >
    <s-tooltip
      v-for="option in options"
      :key="option.value"
      :text="option.label"
    >
      <button
        type="button"
        class="border-side"
        :class="{ on: isOn(option.value) }"
        :aria-label="option.label"
        :aria-pressed="isOn(option.value) ? 'true' : 'false'"
        :disabled="disabled"
        @click="toggle(option.value)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <rect
            x="1.5"
            y="1.5"
            width="11"
            height="11"
            rx="1.5"
            class="side-frame"
            :class="{ solid: option.value === 'all' }"
          />
          <line
            v-if="option.value !== 'all'"
            v-bind="edge(option.value)"
            class="side-edge"
          />
        </svg>
      </button>
    </s-tooltip>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { STooltip } from '@stylebot/components';

import type { Side } from '../../utils/spacing';

const SIDES: Array<Side> = ['top', 'right', 'bottom', 'left'];

const EDGES: Record<Side, Record<string, number>> = {
  top: { x1: 1.5, y1: 1.5, x2: 12.5, y2: 1.5 },
  right: { x1: 12.5, y1: 1.5, x2: 12.5, y2: 12.5 },
  bottom: { x1: 1.5, y1: 12.5, x2: 12.5, y2: 12.5 },
  left: { x1: 1.5, y1: 1.5, x2: 1.5, y2: 12.5 },
};

export default Vue.extend({
  name: 'BorderSidesPicker',

  components: {
    STooltip,
  },

  props: {
    value: {
      type: Array as PropType<Array<Side>>,
      required: true,
    },

    // Outlined, with the selection shown faintly, while the rule has no border.
    unset: {
      type: Boolean,
      default: false,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    options(): Array<{ value: Side | 'all'; label: string }> {
      return [
        { value: 'all', label: this.t('all_sides') },
        ...SIDES.map(side => ({ value: side, label: this.t(side) })),
      ];
    },

    all(): boolean {
      return this.value.length === SIDES.length;
    },
  },

  methods: {
    isOn(option: Side | 'all'): boolean {
      return option === 'all'
        ? this.all
        : !this.all && this.value.includes(option);
    },

    edge(side: Side): Record<string, number> {
      return EDGES[side];
    },

    /**
     * From all sides, a side picks just that side; otherwise sides toggle,
     * and clearing the last one goes back to all sides.
     */
    toggle(option: Side | 'all'): void {
      if (option === 'all') {
        this.$emit('input', [...SIDES]);
        return;
      }

      if (this.all) {
        this.$emit('input', [option]);
        return;
      }

      const next = this.value.includes(option)
        ? this.value.filter(side => side !== option)
        : SIDES.filter(side => side === option || this.value.includes(side));

      this.$emit('input', next.length ? next : [...SIDES]);
    },
  },
});
</script>

<style lang="scss" scoped>
.border-sides {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 7px;
  background: var(--field-surface);

  &.unset {
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--field-fill-border);
  }
}

.border-side {
  @include button-reset;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 24px;
  border-radius: 5px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;

  &:hover:not(.on):not(:disabled) {
    background: color-mix(in srgb, var(--text-primary) 6%, transparent);
  }

  &.on {
    background: var(--field-surface-active);
    box-shadow: 0 1px 2px rgb(0 0 0 / 18%), 0 0 0 1px rgb(0 0 0 / 6%);
    color: var(--text-primary);
  }

  .unset &.on {
    background: color-mix(
      in srgb,
      var(--field-surface-active) 70%,
      transparent
    );
    box-shadow: none;
    color: var(--text-secondary);

    @include dark-mode {
      background: color-mix(in srgb, var(--text-primary) 5%, transparent);
      color: var(--text-body);
    }
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  @include focus-ring;
}

.side-frame {
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
  stroke-dasharray: 2 1.5;
  opacity: 0.6;

  &.solid {
    stroke-width: 1.5;
    stroke-dasharray: none;
    opacity: 1;
  }
}

.side-edge {
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}
</style>
