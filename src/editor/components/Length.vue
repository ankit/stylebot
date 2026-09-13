<template>
  <s-number-field
    :value="length"
    unit="px"
    :presets="sizes"
    :disabled="disabled"
    @input="length = $event"
  />
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { Declaration } from 'postcss';
import { SNumberField } from '@stylebot/components';

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

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },
});
</script>
