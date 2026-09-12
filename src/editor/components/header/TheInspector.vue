<template>
  <button
    type="button"
    class="stylebot-inspector"
    :class="{ active }"
    :disabled="disabled"
    :title="`${t('inspect_description')} (i)`"
    @click="toggle"
  >
    <cursor-icon />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

import { CursorIcon } from '@stylebot/icons';
import { Highlighter } from '@stylebot/highlighter';
import { StylebotEditingMode } from '@stylebot/types';

export default Vue.extend({
  name: 'TheInspector',

  components: {
    CursorIcon,
  },

  data(): {
    highlighter: Highlighter | null;
  } {
    return {
      highlighter: null,
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
        this.highlighter?.stopInspecting();
      } else {
        this.highlighter?.startInspecting();
      }
    },

    mode(newValue: StylebotEditingMode): void {
      if (newValue !== 'basic' && this.active) {
        this.$store.commit('setInspecting', false);
      }
    },
  },

  created() {
    this.highlighter = new Highlighter({ onSelect: this.select });

    if (this.active) {
      this.highlighter?.startInspecting();
    }
  },

  beforeDestroy() {
    this.$store.commit('setInspecting', false);
    this.highlighter?.stopInspecting();
  },

  methods: {
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
  width: 30px;
  height: 30px;
  border-radius: 8px !important;
  cursor: pointer;
  background: var(--active);
  color: var(--foreground);

  &:hover:not(:disabled):not(.active) {
    background: var(--border);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &.active {
    background: var(--primary);
    color: #fff;
  }

  @include focus-ring(2px);
}
</style>
