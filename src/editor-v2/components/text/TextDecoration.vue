<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Decoration
    </css-property>

    <css-property-value-group
      :options="options"
      :selected="selected"
      name="text-decoration"
    />
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
          html: '<span style="text-decoration: underlined">ab</span>',
          value: 'underline',
        },
        {
          html: '<span style="text-decoration: line-through">ab</span>',
          value: 'line-through',
        },
        {
          html: '<span style="text-decoration: overline">ab</span>',
          value: 'overline',
        },

        { text: 'None', value: 'none' },
      ],
    };
  },
});
</script>
