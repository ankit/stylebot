<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      {{ t('text_color') }}
    </css-property>

    <css-property-value>
      <color-picker :property="'color'" />
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';
import ColorPicker from './ColorPicker.vue';

export default Vue.extend({
  name: 'Color',

  components: {
    ColorPicker,
    CssProperty,
    CssPropertyValue,
  },
});
</script>
