<template>
  <s-number-field
    :value="length"
    :unit="shownUnit"
    :step="step"
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
import type { ParsedLength } from '../utils/css-value';
import { extractLength, parseLength } from '../utils/css-value';
import { computedPlaceholder } from '../utils/computed-placeholder';

const FINE_UNITS = ['', 'em', 'rem'];

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
    declared(): ParsedLength | null {
      let value = getDeclarationValue(
        this.$store.getters.activeRule,
        this.property
      );
      if (!value && this.fallback) {
        value = extractLength(this.fallback);
      }

      const parsed = value ? parseLength(value) : null;

      // A field without a unit label can only show px values truthfully.
      if (!parsed || (!this.unit && parsed.unit !== 'px')) {
        return null;
      }

      return parsed;
    },

    currentUnit(): string {
      return this.declared ? this.declared.unit : 'px';
    },

    shownUnit(): string {
      return this.unit && this.declared ? this.declared.unit : this.unit;
    },

    step(): number {
      return FINE_UNITS.includes(this.currentUnit) ? 0.1 : 1;
    },

    length: {
      get(): string {
        return this.declared ? this.declared.length : '';
      },

      set(length: string): void {
        const typed = parseLength(length);
        let value = '';

        if (typed && /[a-z%]$/i.test(length.trim())) {
          value = `${typed.length}${typed.unit}`;
        } else if (length) {
          value = `${length.trim()}${this.currentUnit}`;
        }

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
