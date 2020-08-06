<template>
  <b-row align-content="center" no-gutters>
    <css-property>{{ t('font_variant') }}</css-property>
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
      icon?: string;
      html?: string;
      value: string;
    }>;
  } {
    return {
      options: [
        {
          html: '<span style="font-variant: small-caps">Ab</span>',
          value: 'small-caps',
        },
        { html: 'Normal', value: 'normal' },
      ],
    };
  },
});
</script>
