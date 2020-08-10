<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      {{ t('padding') }}
    </css-property>

    <css-property-value>
      <box-dimensions property="padding" />
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import BoxDimensions from '../BoxDimensions.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

export default Vue.extend({
  name: 'Padding',

  components: {
    CssProperty,
    BoxDimensions,
    CssPropertyValue,
  },
});
</script>
