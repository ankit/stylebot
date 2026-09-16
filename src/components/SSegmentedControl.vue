<template>
  <div ref="root" class="segmented" :class="{ fit }" role="group">
    <span class="segment-indicator" :class="{ ready }" :style="indicatorStyle" />

    <s-tooltip
      v-for="option in options"
      ref="segments"
      :key="option.value"
      :grow="!fit"
      :text="option.title"
      :shortcut="option.shortcut"
    >
      <button
        type="button"
        class="segment"
        :class="{ active: option.value === value }"
        :disabled="disabled"
        @click="$emit('change', option.value)"
      >
        <slot name="option" :option="option">{{ option.label }}</slot>
      </button>
    </s-tooltip>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import STooltip from './STooltip.vue';

type Option = {
  value: string | number;
  label?: string;
  title?: string;
  shortcut?: string;
};

export default Vue.extend({
  name: 'SSegmentedControl',

  components: {
    STooltip,
  },

  model: {
    prop: 'value',
    event: 'change',
  },

  props: {
    value: {
      type: [String, Number],
      default: '',
    },

    options: {
      type: Array as PropType<Array<Option>>,
      required: true,
    },

    // Segments hug their own label instead of sharing equal width — for
    // text options of varying length (icon-based segments want equal width).
    fit: {
      type: Boolean,
      default: false,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  data(): {
    indicatorLeft: number;
    indicatorWidth: number;
    ready: boolean;
    resizeObserver: ResizeObserver | null;
  } {
    return {
      indicatorLeft: 0,
      indicatorWidth: 0,
      // Held back until the first measurement lands, so the indicator
      // doesn't visibly slide in from the top-left corner on mount.
      ready: false,
      resizeObserver: null,
    };
  },

  computed: {
    indicatorStyle(): { transform: string; width: string } {
      return {
        transform: `translateX(${this.indicatorLeft}px)`,
        width: `${this.indicatorWidth}px`,
      };
    },
  },

  watch: {
    value: {
      immediate: true,
      handler(): void {
        this.$nextTick(this.measure);
      },
    },

    options(): void {
      this.$nextTick(this.measure);
    },
  },

  mounted() {
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(this.$refs.root as HTMLElement);
  },

  beforeDestroy() {
    this.resizeObserver?.disconnect();
  },

  methods: {
    measure(): void {
      const segments = this.$refs.segments as Vue[] | undefined;
      const index = this.options.findIndex(option => option.value === this.value);
      const active = segments?.[index]?.$el as HTMLElement | undefined;

      if (!active) {
        return;
      }

      this.indicatorLeft = active.offsetLeft;
      this.indicatorWidth = active.offsetWidth;
      this.ready = true;
    },
  },
});
</script>

<style lang="scss" scoped>
.segmented {
  position: relative;
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--tab-surface);

  &.fit .segment {
    flex: none;
    padding: 4px 10px;
  }
}

.segment-indicator {
  position: absolute;
  top: 2px;
  left: 0;
  bottom: 2px;
  border-radius: 6px;
  background: var(--card-surface);
  box-shadow: 0 1px 2px rgb(0 0 0 / 10%), inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 12%, transparent);
  pointer-events: none;

  &.ready {
    transition: transform 0.2s ease, width 0.2s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.segment {
  position: relative;
  text-align: center;
  white-space: nowrap;
  padding: 4px 0;
  border: none;
  border-radius: 6px;
  background: none;
  font-family: inherit;
  font-size: 12px;
  color: var(--text-muted);
  outline: none;
  cursor: pointer;
  transition: color 0.15s ease, font-weight 0.15s ease;

  &.active {
    font-weight: 600;
    color: var(--text-primary);
  }

  ::v-deep svg {
    transition: stroke-width 0.15s ease;
  }

  &.active ::v-deep svg {
    stroke-width: 1.9;
  }

  ::v-deep span {
    font-weight: inherit;
  }

  &:focus-visible {
    color: var(--text-primary);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  @include focus-ring;
}
</style>
