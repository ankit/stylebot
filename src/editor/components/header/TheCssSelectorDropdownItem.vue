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
import { validateSelector } from '@stylebot/css';
import { Highlighter } from '@stylebot/highlighter';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',
  props: {
    selector: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
  },

  data(): { highlighter: Highlighter | null } {
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
      if (validateSelector(this.selector)) {
        this.highlighter?.highlight(this.selector);
      } else {
        this.highlighter?.unhighlight();
      }
    },

    mouseleave(): void {
      this.highlighter?.unhighlight();
    },
  },
});
</script>

<style lang="scss" scoped>
.css-selector-dropdown-item {
  font-family: Monaco, monospace;
}
</style>
