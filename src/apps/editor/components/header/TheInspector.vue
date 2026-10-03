<template>
  <s-tooltip :text="t('inspect_description')" shortcut="i">
    <button
      ref="button"
      type="button"
      class="stylebot-inspector"
      :class="{ active }"
      :disabled="disabled"
      :aria-label="t('inspect_description')"
      @click="toggle"
    >
      <inspector-icon :size="16" />
    </button>
  </s-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';

import { STooltip } from '@stylebot/components';
import { InspectorIcon } from '@stylebot/icons';
import type { StylebotEditingMode } from '@stylebot/types';

import { getPageBridge } from '@stylebot/page-bridge';

import type { Debounced } from '@stylebot/utils';
import { KEYBOARD_FOCUS, debounce } from '@stylebot/utils';

const PREVIEW_DELAY = 100;

export default Vue.extend({
  name: 'TheInspector',

  components: {
    InspectorIcon,
    STooltip,
  },

  data(): {
    unsubscribeSelect: (() => void) | null;
    unsubscribeHover: (() => void) | null;
    preview: Debounced<[string]>;
  } {
    return {
      unsubscribeSelect: null,
      unsubscribeHover: null,
      // Sweeping across elements shouldn't ask the page about each one.
      preview: debounce(selector => {
        if (this.$store.state.inspecting) {
          this.$store.commit('setPreviewSelector', selector);
        }
      }, PREVIEW_DELAY),
    };
  },

  computed: {
    active(): boolean {
      return this.$store.state.inspecting;
    },

    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },

    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    disabled(): boolean {
      return !['basic', 'chat'].includes(this.mode);
    },
  },

  watch: {
    active(newValue: boolean): void {
      if (!newValue) {
        getPageBridge().stopInspecting();
      } else {
        getPageBridge().startInspecting();
      }
    },

    mode(newValue: StylebotEditingMode): void {
      if (newValue !== 'basic' && newValue !== 'chat' && this.active) {
        this.$store.commit('setInspecting', false);
      }
    },
  },

  created() {
    this.unsubscribeSelect = getPageBridge().on('select', this.select);
    this.unsubscribeHover = getPageBridge().on('hover', this.preview);
  },

  // On mount, not create: a replaced instance stops inspecting on destroy,
  // which Vue runs after the replacement's created hook.
  mounted() {
    if (this.active) {
      getPageBridge().startInspecting();
    }
  },

  beforeDestroy() {
    this.unsubscribeSelect?.();
    this.unsubscribeHover?.();
    this.preview.cancel();
    this.$store.commit('setInspecting', false);
    getPageBridge().stopInspecting();
  },

  methods: {
    focus(): void {
      const { button } = this.$refs;

      if (button instanceof HTMLElement) {
        button.focus(KEYBOARD_FOCUS);
      }
    },

    toggle(): void {
      if (this.active) {
        this.$store.commit('setInspecting', false);
      } else {
        this.$store.commit('setInspecting', true);
        this.$store.commit('setActiveSelector', '');
      }
    },

    select(selector: string): void {
      this.preview.cancel();
      this.toggle();
      this.$emit('select', selector);
    },
  },
});
</script>

<style lang="scss">
.stylebot-inspector {
  @include button-reset;

  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px !important;
  cursor: pointer;
  background: var(--field-surface);
  color: var(--text-primary);

  &:hover:not(:disabled):not(.active) {
    background: var(--field-surface-hover);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &.active {
    background: var(--accent);
    color: var(--accent-ink);
  }

  @include focus-ring(2px);
}
</style>
