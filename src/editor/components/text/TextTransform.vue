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

  data(): {
    options: Array<{
      title: string;
      icon?: string;
      html?: string;
      value: string;
    }>;
  } {
    return {
      options: [
        {
          title: 'Capitalize',
          html: 'Ab',
          value: 'capitalize',
        },
        {
          title: 'Uppercase',
          html: 'AB',
          value: 'uppercase',
        },
        {
          title: 'Lowercase',
          html: 'ab',
          value: 'lowercase',
        },

        { title: 'None', html: 'None', value: 'none' },
      ],
    };
  },
});
</script>
