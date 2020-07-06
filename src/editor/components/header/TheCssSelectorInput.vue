<template>
  <b-form-input
    @blur="blur"
    @focus="focus"
    @input="input"
    :value="activeSelector"
    class="css-selector-input"
    placeholder="Enter CSS selector..."
  />
</template>

<script lang="ts">
import Vue from 'vue';

import CssUtils from '../../../css/CssUtils';
import Highlighter from '../../highlighter/Highlighter';

export default Vue.extend({
  name: 'TheCssSelectorInput',

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

  computed: {
    activeSelector(): string {
      return this.$store.state.activeSelector;
    },
  },

  methods: {
    input(selector: string): void {
      this.$store.dispatch('setActiveSelector', selector);

      if (CssUtils.validateSelector(selector)) {
        this.highlighter.highlight(selector);
      } else {
        this.highlighter.unhighlight();
      }
    },

    focus(): void {
      const selector = this.$store.state.activeSelector;

      if (CssUtils.validateSelector(selector)) {
        this.highlighter.highlight(selector);
      } else {
        this.highlighter.unhighlight();
      }
    },

    blur(): void {
      const selector = this.$store.state.activeSelector;
      this.highlighter.unhighlight();
    },
  },
});
</script>

<style lang="scss">
.css-selector-input {
  &:focus {
    box-shadow: none !important;
  }

  &.form-control {
    height: 30px !important;
    font-size: 13px !important;
    margin-left: 8px !important;
  }
}
</style>
