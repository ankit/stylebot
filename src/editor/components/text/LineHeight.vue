<template>
  <b-row align-content="center" no-gutters>
    <css-property>{{ t('line_height') }}</css-property>

    <css-property-value>
      <length property="line-height" :sizes="sizes" />
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import Length from '../Length.vue';
import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

export default Vue.extend({
  name: 'LineHeight',

  components: {
    Length,
    CssProperty,
    CssPropertyValue,
  },

  data(): {
    sizes: Array<string>;
  } {
    return {
      sizes: ['12', '14', '18', '24', '30', '36', '48'],
    };
  },
});
</script>
