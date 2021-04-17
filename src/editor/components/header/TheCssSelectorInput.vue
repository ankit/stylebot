<template>
  <b-form-input
    :disabled="disabled"
    :value="activeSelector"
    size="sm"
    class="css-selector-input"
    :placeholder="t('enter_css_selector')"
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

  data(): { highlighter: Highlighter | null } {
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
        this.highlighter?.highlight(selector);
      } else {
        this.highlighter?.unhighlight();
      }
    },

    focus(): void {
      const selector = this.$store.state.activeSelector;

      if (validateSelector(selector)) {
        this.highlighter?.highlight(selector);
        window.addEventListener('scroll', this.onWindowScroll, true);
      } else {
        this.highlighter?.unhighlight();
      }
    },

    blur(): void {
      this.highlighter?.unhighlight();
      window.removeEventListener('scroll', this.onWindowScroll, true);
    },

    onWindowScroll(): void {
      if (this.activeSelector) {
        this.highlighter?.highlight(this.activeSelector);
      }
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
    margin-left: 8px !important;
  }
}
</style>
