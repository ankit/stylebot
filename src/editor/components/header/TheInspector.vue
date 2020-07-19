<template>
  <b-btn
    class="stylebot-inspector"
    :class="{ active }"
    :disabled="disabled"
    title="Select an element in the page to style it (I)"
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

    if (this.$store.state.options.mode === 'basic') {
      this.$store.commit('setInspecting', true);
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
  outline: none !important;
  font-size: 21px !important;
  border-color: #ccc !important;
  padding: 13px 13px 10px 13px !important;

  &:hover,
  &:focus {
    outline: none;
  }

  svg {
    // todo: avoid doing this pixel pushing, fix svg
    margin-top: -5px;
    margin-left: 1px;
  }

  path {
    fill: #555;
  }

  &:hover,
  &.active {
    path {
      fill: #fff;
    }
  }
}
</style>
