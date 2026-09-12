<template>
  <input
    :disabled="disabled"
    :value="activeSelector"
    class="selector-text"
    :placeholder="t('enter_css_selector')"
    @blur="blur"
    @focus="focus"
    @input="input($event.target.value)"
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

<style lang="scss" scoped>
.selector-text {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  padding: 0;
  font: 500 12.5px/1.3 Menlo, Monaco, Consolas, monospace;
  color: var(--foreground);

  &::placeholder {
    font-family: 'Public Sans', system-ui, sans-serif;
    color: var(--muted-foreground);
  }

  &:disabled {
    opacity: 0.6;
  }
}
</style>
