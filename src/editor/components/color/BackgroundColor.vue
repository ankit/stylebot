<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Background Color
    </css-property>

    <css-property-value>
      <b-row>
        <b-col cols="3">
          <color-picker color="#ffd700" />
        </b-col>

        <b-col cols="9">
          <b-form-input size="sm" value="#ffd700" />
        </b-col>
      </b-row>
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import ColorPicker from './ColorPicker.vue';
import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

export default Vue.extend({
  name: 'BackgroundColor',

  components: {
    ColorPicker,
    CssProperty,
    CssPropertyValue,
  },
});
</script>
