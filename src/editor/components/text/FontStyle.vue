<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Font Style
    </css-property>

    <css-property-value-group property="font-style" :options="options" />
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';

export default Vue.extend({
  name: 'FontStyle',

  components: {
    CssProperty,
    CssPropertyValueGroup,
  },

  data(): any {
    return {
      options: [
        { content: '<i>Italic</i>', value: 'italic' },
        { content: 'Normal', value: 'normal' },
      ],
    };
  },
});
</script>
