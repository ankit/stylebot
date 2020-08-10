<template>
  <b-row align-content="center" no-gutters>
    <css-property>{{ t('text_align') }}</css-property>
    <css-property-value-group property="text-align" :options="options" />
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';

export default Vue.extend({
  name: 'TextAlign',

  components: {
    CssProperty,
    CssPropertyValueGroup,
  },

  data(): {
    options: Array<{
      title: string;
      value: string;
      icon: string;
    }>;
  } {
    return {
      options: [
        { title: 'Align Left', value: 'left', icon: 'text-left' },
        { title: 'Align Center', value: 'center', icon: 'text-center' },
        { title: 'Align Right', value: 'right', icon: 'text-right' },
      ],
    };
  },
});
</script>
