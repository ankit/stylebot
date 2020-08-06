<template>
  <b-row align-content="center" no-gutters>
    <css-property>{{ t('font_size') }}</css-property>

    <css-property-value>
      <Length property="font-size" :sizes="sizes" />
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

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

  data(): {
    sizes: Array<string>;
  } {
    return {
      sizes: ['8', '9', '10', '11', '12', '14', '18', '24', '30', '36', '48'],
    };
  },
});
</script>
