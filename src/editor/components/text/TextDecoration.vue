<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Decoration
    </css-property>

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

  data(): any {
    return {
      selected: null,
      options: [
        {
          content: '<span style="text-decoration: underlined">ab</span>',
          value: 'underline',
        },
        {
          content: '<span style="text-decoration: line-through">ab</span>',
          value: 'line-through',
        },
        {
          content: '<span style="text-decoration: overline">ab</span>',
          value: 'overline',
        },

        { content: 'None', value: 'none' },
      ],
    };
  },
});
</script>
