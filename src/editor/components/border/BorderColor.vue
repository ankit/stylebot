<template>
  <property-row :label="t('border_color')">
    <color-picker property="border-color" />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';

import PropertyRow from '../basic/PropertyRow.vue';
import ColorPicker from '../color/ColorPicker.vue';

export default Vue.extend({
  name: 'BorderColor',

  components: {
    PropertyRow,
    ColorPicker,
  },
});
</script>
