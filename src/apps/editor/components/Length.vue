<template>
  <s-number-field
    :value="length"
    :unit="unit"
    :presets="sizes"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="length = $event"
  />
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SNumberField } from '@stylebot/components';
import { getDeclarationValue } from '@stylebot/css';
import { extractLength } from '../utils/css-value';
import { computedPlaceholder } from '../utils/computed-placeholder';

// todo: support other units.
// currently, we render empty input and overwrite on edit
const PX_LENGTH = /^(-?(?:\d+\.?\d*|\.\d+))px$/i;

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

    unit: {
      type: String,
      default: 'px',
    },

    // Other properties that take the same value, e.g. a border's other sides.
    mirror: {
      type: Array as PropType<Array<string>>,
      default: () => [],
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
        let value = getDeclarationValue(
          this.$store.getters.activeRule,
          this.property
        );
        if (!value && this.fallback) {
          value = extractLength(this.fallback);
        }

        if (!value) {
          return '';
        }

        const match = value.trim().match(PX_LENGTH);

        return match ? match[1] : '';
      },

      set(length: string): void {
        const value = length ? `${length}px` : '';

        if (this.mirror.length === 0) {
          this.$store.dispatch('applyDeclaration', {
            property: this.property,
            value,
          });
          return;
        }

        this.$store.dispatch(
          'applyDeclarations',
          [this.property, ...this.mirror].map(property => ({ property, value }))
        );
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
