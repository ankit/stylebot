<template>
  <b-row align-content="center" no-gutters>
    <css-property>{{ t('margin') }}</css-property>

    <css-property-value>
      <box-dimensions property="margin" />
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import BoxDimensions from '../BoxDimensions.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

export default Vue.extend({
  name: 'Margin',

  components: {
    CssProperty,
    BoxDimensions,
    CssPropertyValue,
  },
});
</script>
