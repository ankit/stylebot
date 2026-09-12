<template>
  <div class="value-group" role="group">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="value-option"
      :class="{ active: value === option.value }"
      :disabled="disabled"
      :title="option.title"
      @click="select(option.value)"
    >
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-html="option.html" />
    </button>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { Declaration } from 'postcss';

type Option = { title: string; html: string; value: string };

export default Vue.extend({
  name: 'CssPropertyValueGroup',

  props: {
    property: {
      type: String,
      required: true,
    },

    options: {
      type: Array as PropType<Array<Option>>,
      required: true,
    },
  },

  computed: {
    value(): string {
      const activeRule = this.$store.getters.activeRule;

      let value = '';
      if (activeRule) {
        activeRule.clone().walkDecls(this.property, (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value;
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    select(value: string): void {
      // Clicking the active option clears the declaration.
      this.$store.dispatch('applyDeclaration', {
        property: this.property,
        value: value === this.value ? '' : value,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.value-group {
  display: flex;
  gap: 1px;
  padding: 1px;
  border-radius: 7px;
  background: var(--accent);
}

.value-option {
  @include button-reset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 27px;
  padding: 5px 6px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.2;
  color: var(--muted-foreground);
  cursor: pointer;

  &:hover:not(:disabled):not(.active) {
    color: var(--foreground);
  }

  &.active {
    font-weight: 600;
    color: var(--foreground);
    background: var(--background);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  @include focus-ring(-2px);
}
</style>
