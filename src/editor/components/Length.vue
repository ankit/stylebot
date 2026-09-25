<template>
  <s-number-field
    :value="length"
    unit="px"
    :presets="sizes"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="length = $event"
  />
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { Declaration } from 'postcss';
import { SNumberField } from '@stylebot/components';
import { extractLength } from '../utils/css-value';
import { computedPlaceholder } from '../utils/computed-placeholder';

export default Vue.extend({
  name: 'Length',

  components: {
    SNumberField,
  },

  props: {
    sizes: {
      type: Array as PropType<Array<string>>,
      required: false,
      default: () => [],
    },

    property: {
      type: String,
      required: true,
    },

    // Raw value of a shorthand property (e.g. border: 1px solid red) to
    // pull a length from when `property` itself isn't declared.
    fallback: {
      type: String,
      default: '',
    },
  },

  computed: {
    length: {
      get(): string {
        const activeRule = this.$store.getters.activeRule;
        let value = '';

        if (activeRule) {
          activeRule.clone().walkDecls(this.property, (decl: Declaration) => {
            value = decl.value;
          });
        }

        if (!value && this.fallback) {
          value = extractLength(this.fallback);
        }

        if (!value) {
          return '';
        }

        const [length, unit] = value.split(/(-?\d+)/).filter(Boolean);

        // todo: support other units.
        // currently, we render empty input and overwrite on edit
        if (unit !== 'px') {
          return '';
        }

        return length;
      },

      set(length: string): void {
        const value = length ? `${length}px` : '';

        this.$store.dispatch('applyDeclaration', {
          property: this.property,
          value,
        });
      },
    },

    placeholder(): string {
      return computedPlaceholder(
        this.$store.state.computedStyles,
        this.property
      );
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },
});
</script>
