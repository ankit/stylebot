<template>
  <div @mouseenter="mouseenter" @mouseleave="mouseleave">
    <b-dropdown-item
      :title="`${selector} (${count})`"
      class="css-selector-dropdown-item"
      @click="click"
    >
      {{ `${selector} (${count})` }}
    </b-dropdown-item>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import CssUtils from '../../../css/CssUtils';
import Highlighter from '../../highlighter/Highlighter';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',
  props: ['selector', 'count'],

  data(): any {
    return {
      highlighter: null,
    };
  },

  created() {
    this.highlighter = new Highlighter({
      onSelect: () => {
        return;
      },
    });
  },

  methods: {
    click(): void {
      this.$store.commit('setActiveSelector', this.selector);
    },

    mouseenter(): void {
      if (CssUtils.validateSelector(this.selector)) {
        this.highlighter.highlight(this.selector);
      } else {
        this.highlighter.unhighlight();
      }
    },

    mouseleave(): void {
      this.highlighter.unhighlight();
    },
  },
});
</script>

<style lang="scss" scoped>
.css-selector-dropdown-item {
  font-family: Monaco, monospace;
}
</style>
