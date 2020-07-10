<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Font Size
    </css-property>

    <css-property-value>
      <Length property="font-size" />
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

import Length from '../Length.vue';
import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

export default Vue.extend({
  name: 'FontSize',

  components: {
    Length,
    CssProperty,
    CssPropertyValue,
  },

  computed: {
    value(): string {
      const activeRule = this.$store.getters.activeRule;
      let value = '';

      if (activeRule) {
        activeRule.clone().walkDecls('font-size', (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value;
    },
  },

  methods: {
    input(value: string): void {
      this.$store.dispatch('applyDeclaration', {
        property: 'font-size',
        value,
      });
    },
  },
});
</script>
