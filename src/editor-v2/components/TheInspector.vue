<template>
  <button
    @click="toggle"
    class="stylebot-inspector"
    :class="{ enabled: enabled }"
    title="Select an element in the page to style it"
    v-b-tooltip.hover.nofade="{ customClass: 'stylebot-tooltip' }"
  >
    <b-icon icon="cursor" font-scale="2" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import Highlighter from '../highlighter/Highlighter';

export default Vue.extend({
  name: 'TheInspector',

  data(): {
    enabled: boolean;
    highlighter: Highlighter | null;
  } {
    return {
      enabled: false,
      highlighter: null,
    };
  },

  created() {
    this.highlighter = new Highlighter({ onSelect: this.select });
  },

  methods: {
    toggle(): void {
      if (this.enabled) {
        this.enabled = false;
        this.highlighter?.stopInspecting();
      } else {
        this.enabled = true;
        this.highlighter?.startInspecting();
      }
    },

    select(selector: string): void {
      this.toggle();
      this.$emit('select', selector);
    },
  },
});
</script>

<style lang="scss" scoped>
.stylebot-inspector {
  width: 50px;
  padding: 4px;
  border: none;
  outline: 1px solid #ddd;

  &:hover,
  &:focus {
    cursor: pointer;
    outline: 1px solid #333;
  }

  &.enabled {
    color: #fff;
    background: #333;
    outline: 1px solid #333;
  }
}
</style>
