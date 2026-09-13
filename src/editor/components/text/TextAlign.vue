<template>
  <property-row :label="t('text_align')">
    <css-property-value-group property="text-align" :options="options" />
  </property-row>
</template>

<script lang="ts">
import Vue, { Component } from 'vue';

import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from '@stylebot/icons';
import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';
import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'TextAlign',

  components: {
    CssPropertyValueGroup,
    PropertyRow,
  },

  data(): {
    options: Array<{ title: string; value: string; icon: Component }>;
  } {
    return {
      options: [
        { title: 'Align Left', value: 'left', icon: AlignLeftIcon },
        { title: 'Align Center', value: 'center', icon: AlignCenterIcon },
        { title: 'Align Right', value: 'right', icon: AlignRightIcon },
      ],
    };
  },
});
</script>
