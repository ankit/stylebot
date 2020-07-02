<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Transform
    </css-property>

    <css-property-value-group property="text-transform" :options="options" />
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
          content: 'Abc',
          value: 'capitalize',
        },
        {
          content: 'ABC',
          value: 'uppercase',
        },
        {
          content: 'abc',
          value: 'lowercase',
        },

        { content: 'None', value: 'none' },
      ],
    };
  },
});
</script>
