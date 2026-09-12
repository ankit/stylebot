<template>
  <menu-item class="css-selector-dropdown-item" @click="click" @mouseenter.native="mouseenter" @mouseleave.native="mouseleave">
    {{ `${selector} (${count})` }}
  </menu-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { MenuItem } from '@stylebot/components';
import { validateSelector } from '@stylebot/css';
import { Highlighter } from '@stylebot/highlighter';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',

  components: {
    MenuItem,
  },

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
      this.$emit('select');
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
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: Menlo, Monaco, Consolas, monospace;
}
</style>
