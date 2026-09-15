<template>
  <div ref="root" class="tabs" role="tablist">
    <span class="tab-indicator" :class="{ ready }" :style="indicatorStyle" />

    <button
      v-for="tab in tabs"
      ref="tabButtons"
      :key="tab.value"
      type="button"
      class="tab"
      :class="{ active: tab.value === value }"
      :disabled="tab.disabled"
      role="tab"
      :aria-selected="tab.value === value"
      :title="tab.title"
      @click="$emit('change', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

type Tab = {
  value: string | number;
  label: string;
  title?: string;
  disabled?: boolean;
};

export default Vue.extend({
  name: 'STabs',

  model: {
    prop: 'value',
    event: 'change',
  },

  props: {
    value: {
      type: [String, Number],
      default: '',
    },

    tabs: {
      type: Array as PropType<Array<Tab>>,
      required: true,
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

    tabs(): void {
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
      const buttons = this.$refs.tabButtons as HTMLElement[] | undefined;
      const index = this.tabs.findIndex(tab => tab.value === this.value);
      const active = buttons?.[index];

      if (!active) {
        this.indicatorWidth = 0;
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
.tabs {
  position: relative;
  display: flex;
  gap: 6px;
  padding: 0 10px;
  border-bottom: 1px solid var(--panel-border);
}

.tab-indicator {
  position: absolute;
  left: 0;
  bottom: -1px;
  height: 2px;
  background: var(--accent);
  pointer-events: none;

  &.ready {
    transition: transform 0.2s ease, width 0.2s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.tab {
  position: relative;
  padding: 4px 6px 3px;
  border: none;
  border-radius: 0;
  background: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.3;
  color: var(--text-muted);
  outline: none;
  cursor: pointer;
  transition: color 0.15s ease, font-weight 0.15s ease;

  &:hover:not(:disabled):not(.active) {
    color: var(--text-primary);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &.active {
    font-weight: 600;
    color: var(--text-primary);
  }

  @include focus-ring;
}
</style>
