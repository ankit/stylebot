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
import { StylebotEditingMode } from '@stylebot/types';

import { getPageBridge } from '@stylebot/page-bridge';

import { KEYBOARD_FOCUS } from '../../utils/field-escape';

export default Vue.extend({
  name: 'TheInspector',

  components: {
    InspectorIcon,
    STooltip,
  },

  data(): {
    unsubscribeSelect: (() => void) | null;
  } {
    return {
      unsubscribeSelect: null,
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
      return this.mode !== 'basic' && this.mode !== 'code';
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
      if (newValue !== 'basic' && this.active) {
        this.$store.commit('setInspecting', false);
      }
    },
  },

  created() {
    this.unsubscribeSelect = getPageBridge().on('select', this.select);
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
  width: 34px;
  height: 34px;
  border-radius: 8px !important;
  cursor: pointer;
  background: var(--active);
  color: var(--text-primary);

  &:hover:not(:disabled):not(.active) {
    background: var(--panel-border);
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
