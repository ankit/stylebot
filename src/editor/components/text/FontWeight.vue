<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Font Weight
    </css-property>

    <css-property-value-group property="font-weight" :options="options" />
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
        { content: '<strong>Bold</strong>', value: 'bold' },
        { content: 'Normal', value: 'normal' },
      ],
    };
  },
});
</script>
