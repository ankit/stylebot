<template>
  <b-row align-content="center" no-gutters>
    <css-property>Font Size</css-property>

    <css-property-value>
      <Length property="font-size" />
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
});
</script>
