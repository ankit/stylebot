<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      {{ t('font_weight') }}
    </css-property>

    <css-property-value-group property="font-weight" :options="options" />
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';

export default Vue.extend({
  name: 'FontWeight',

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
        { title: 'Bold', icon: 'type-bold', value: 'bold' },
        { title: 'Normal', html: 'None', value: 'normal' },
      ],
    };
  },
});
</script>
