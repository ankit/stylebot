<template>
  <property-row :label="t('background_color')">
    <color-picker property="background-color" />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';

import PropertyRow from '../basic/PropertyRow.vue';
import ColorPicker from './ColorPicker.vue';

export default Vue.extend({
  name: 'BackgroundColor',

  components: {
    PropertyRow,
    ColorPicker,
  },
});
</script>
