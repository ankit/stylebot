<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Font Style
    </css-property>

    <css-property-value-group
      name="font-style"
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
  name: 'FontStyle',

  components: {
    CssProperty,
    CssPropertyValueGroup,
  },

  data(): any {
    return {
      selected: null,
      options: [
        { html: '<i>Italic</i>', value: 'italic' },
        { text: 'Normal', value: 'normal' },
      ],
    };
  },
});
</script>
