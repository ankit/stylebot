<template>
  <b-btn
    class="stylebot-inspector"
    :class="{ active }"
    :disabled="disabled"
    :title="`${t('inspect_description')} (i)`"
    :variant="active ? 'primary' : 'outline-secondary'"
    @click="toggle"
  >
    <inspector-icon />
  </b-btn>
</template>

<script lang="ts">
import Vue from 'vue';

import { Highlighter } from '@stylebot/highlighter';
import { StylebotEditingMode } from '@stylebot/types';

import InspectorIcon from './InspectorIcon.vue';

export default Vue.extend({
  name: 'TheInspector',

  components: {
    InspectorIcon,
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
      return this.mode !== 'basic';
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
  height: 53px !important;
  outline: none !important;
  font-size: 21px !important;
  border-color: #ccc !important;
  line-height: 29px !important;

  &:hover,
  &:focus {
    outline: none;
  }

  svg {
    // todo: avoid this pixel pushing
    margin-left: 1px !important;
  }

  path {
    fill: #555;
  }

  &:hover:not(:disabled),
  &.active {
    path {
      fill: #fff;
    }
  }
}
</style>
