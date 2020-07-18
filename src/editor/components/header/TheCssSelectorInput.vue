<template>
  <b-form-input
    :disabled="disabled"
    :value="activeSelector"
    class="css-selector-input"
    placeholder="Enter CSS selector..."
    @blur="blur"
    @focus="focus"
    @input="input"
  />
</template>

<script lang="ts">
import Vue from 'vue';
import { validateSelector } from '@stylebot/css';
import { Highlighter } from '@stylebot/highlighter';

export default Vue.extend({
  name: 'TheCssSelectorInput',
  props: {
    disabled: {
      type: Boolean,
      required: true,
    },
  },

  data(): any {
    return {
      highlighter: null,
    };
  },

  computed: {
    activeSelector(): string {
      return this.$store.state.activeSelector;
    },
  },

  created() {
    this.highlighter = new Highlighter({
      onSelect: () => {
        return;
      },
    });
  },

  methods: {
    input(selector: string): void {
      this.$store.commit('setActiveSelector', selector);

      if (validateSelector(selector)) {
        this.highlighter.highlight(selector);
      } else {
        this.highlighter.unhighlight();
      }
    },

    focus(): void {
      const selector = this.$store.state.activeSelector;

      if (validateSelector(selector)) {
        this.highlighter.highlight(selector);
      } else {
        this.highlighter.unhighlight();
      }
    },

    blur(): void {
      this.highlighter.unhighlight();
    },
  },
});
</script>

<style lang="scss">
.css-selector-input {
  padding: 4px !important;

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
