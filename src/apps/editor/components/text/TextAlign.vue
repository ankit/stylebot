<template>
  <property-row property="text-align" :label="t('text_align')">
    <css-property-value-group property="text-align" :options="options" />
  </property-row>
</template>

<script lang="ts">
import type { Component } from 'vue';
import Vue from 'vue';

import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
} from '@stylebot/icons';
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
        { title: this.t('align_left'), value: 'left', icon: AlignLeftIcon },
        {
          title: this.t('align_center'),
          value: 'center',
          icon: AlignCenterIcon,
        },
        {
          title: this.t('align_right'),
          value: 'right',
          icon: AlignRightIcon,
        },
      ],
    };
  },
});
</script>
