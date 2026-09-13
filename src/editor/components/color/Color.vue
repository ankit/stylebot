<template>
  <property-row :label="t('text_color')">
    <color-picker property="color" />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';

import PropertyRow from '../basic/PropertyRow.vue';
import ColorPicker from './ColorPicker.vue';

export default Vue.extend({
  name: 'Color',

  components: {
    PropertyRow,
    ColorPicker,
  },
});
</script>
