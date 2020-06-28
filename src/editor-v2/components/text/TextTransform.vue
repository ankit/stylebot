<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Transform
    </css-property>

    <css-property-value-group
      :options="options"
      :selected="selected"
      name="text-transform"
    />
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';

export default Vue.extend({
  name: 'TextTransform',

  components: {
    CssProperty,
    CssPropertyValueGroup,
  },

  data(): any {
    return {
      selected: null,
      options: [
        {
          text: 'Abc',
          value: 'capitalize',
        },
        {
          text: 'ABC',
          value: 'uppercase',
        },
        {
          text: 'abc',
          value: 'lowercase',
        },

        { text: 'None', value: 'none' },
      ],
    };
  },
});
</script>
