<template>
  <div class="basic-color-palette">
    <v-swatches v-model="value" inline swatches="text-advanced" />
    <color-palette-picker class="mt-1" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VSwatches from 'vue-swatches';
import ColorPalettePicker from './ColorPalettePicker.vue';

export default Vue.extend({
  name: 'BasicColorPalette',

  components: {
    VSwatches,
    ColorPalettePicker,
  },

  props: {
    value: {
      type: String,
      required: true,
    },
  },

  watch: {
    value() {
      this.$emit('input', this.value);
    },
  },
});
</script>

<style lang="scss">
.basic-color-palette {
  width: 262px;
  left: -90px;
  bottom: 36px;
  padding: 10px;
  background: #fff;
  border: 1px solid #ccc;
  line-height: 0;
  position: absolute;
  z-index: 10000000000000;
}
</style>
