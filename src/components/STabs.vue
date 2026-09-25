<template>
  <div ref="root" class="tabs" role="tablist">
    <span class="tab-indicator" :class="{ ready }" :style="indicatorStyle" />

    <s-tooltip
      v-for="tab in tabs"
      :key="tab.value"
      :text="tab.title"
      :shortcut="tab.shortcut"
    >
      <button
        ref="tabButtons"
        type="button"
        class="tab"
        :class="{ active: tab.value === value }"
        :disabled="tab.disabled"
        role="tab"
        :aria-selected="tab.value === value"
        @click="$emit('change', tab.value)"
      >
        <span ref="tabLabels" class="tab-label">{{ tab.label }}</span>
      </button>
    </s-tooltip>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import STooltip from './STooltip.vue';

type Tab = {
  value: string | number;
  label: string;
  title?: string;
  shortcut?: string;
  disabled?: boolean;
};

export default Vue.extend({
  name: 'STabs',

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
    focusSelectedTab(options?: FocusOptions): void {
      const { tabButtons } = this.$refs;
      const index = this.tabs.findIndex(tab => tab.value === this.value);
      const button = Array.isArray(tabButtons) ? tabButtons[index] : undefined;

      if (button instanceof HTMLElement) {
        button.focus(options);
      }
    },

    measure(): void {
      const root = this.$refs.root as HTMLElement | undefined;
      const labels = this.$refs.tabLabels as Array<HTMLElement> | undefined;
      const index = this.tabs.findIndex(tab => tab.value === this.value);
      const active = labels?.[index];

      if (!root || !active) {
        this.indicatorWidth = 0;
        return;
      }

      // getBoundingClientRect, not offsetLeft/offsetWidth — integer rounding accumulates across siblings.
      const rootRect = root.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      this.indicatorLeft = activeRect.left - rootRect.left;
      this.indicatorWidth = activeRect.width;
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
  padding: 6px 6px 8px;
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
  transition: color 0.15s ease;

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
