<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Style
    </css-property>

    <css-property-value-group property="font-style" :options="options" />
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';

export default Vue.extend({
  name: 'FontStyle',

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
        { title: 'Italic', icon: 'type-italic', value: 'italic' },
        { title: 'Normal', html: 'None', value: 'normal' },
      ],
    };
  },
});
</script>
