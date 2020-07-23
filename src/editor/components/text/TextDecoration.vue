<template>
  <b-row align-content="center" no-gutters>
    <css-property>Decorate</css-property>
    <css-property-value-group property="text-decoration" :options="options" />
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';

export default Vue.extend({
  name: 'TextDecoration',

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
          title: 'Underline',
          icon: 'type-underline',
          value: 'underline',
        },

        {
          title: 'Strikethrough',
          icon: 'type-strikethrough',
          value: 'line-through',
        },

        {
          title: 'Overline',
          html: '<span style="text-decoration: overline">A</span>',
          value: 'overline',
        },

        { title: 'None', html: 'None', value: 'none' },
      ],
    };
  },
});
</script>
