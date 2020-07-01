<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Font Weight
    </css-property>

    <css-property-value-group
      name="font-weight"
      :options="options"
      :selected="selected"
    />
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';

export default Vue.extend({
  name: 'FontWeight',

  components: {
    CssProperty,
    CssPropertyValueGroup,
  },

  data(): any {
    return {
      selected: null,
      options: [
        { html: '<strong>Bold</strong>', value: 'bold' },
        { text: 'Normal', value: 'normal' },
      ],
    };
  },
});
</script>
