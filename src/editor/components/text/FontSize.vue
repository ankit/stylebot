<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Font Size
    </css-property>

    <css-property-value>
      <b-input-group style="width: 100px">
        <b-form-input size="sm" />

        <template v-slot:append>
          <b-dropdown text="px" variant="outline-secondary" size="sm">
            <b-dropdown-item>px</b-dropdown-item>
            <b-dropdown-item>em</b-dropdown-item>
            <b-dropdown-item>%</b-dropdown-item>
            <b-dropdown-item>pt</b-dropdown-item>
          </b-dropdown>
        </template>
      </b-input-group>
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

export default Vue.extend({
  name: 'FontSize',
  components: {
    CssProperty,
    CssPropertyValue,
  },
});
</script>
