<template>
  <b-row align-content="center" no-gutters>
    <css-property>Font Variant</css-property>
    <css-property-value-group property="font-variant" :options="options" />
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';

export default Vue.extend({
  name: 'FontVariant',

  components: {
    CssProperty,
    CssPropertyValueGroup,
  },

  data(): {
    options: Array<{
      content: string;
      value: string;
    }>;
  } {
    return {
      options: [
        {
          content: '<span style="font-variant: small-caps">Small Caps</span>',
          value: 'small-caps',
        },
        { content: 'Normal', value: 'normal' },
      ],
    };
  },
});
</script>
