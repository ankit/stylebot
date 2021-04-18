<template>
  <div class="material-color-palette">
    <v-swatches
      v-model="value"
      inline
      :swatch-size="18"
      :spacing-size="0"
      :swatches="swatches"
      :swatch-style="{ borderRadius: 0 }"
    />

    <color-palette-picker class="mt-1" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VSwatches from 'vue-swatches';
import ColorPalettePicker from './ColorPalettePicker.vue';
import { materialSwatches as swatches } from '../../utils/swatches';

export default Vue.extend({
  name: 'MaterialColorPalette',

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

  data() {
    return {
      swatches,
    };
  },

  watch: {
    value() {
      this.$emit('input', this.value);
    },
  },
});
</script>

<style lang="scss">
.material-color-palette {
  width: 202px;
  left: -80px;
  bottom: 36px;
  padding: 10px;
  background: #fff;
  border: 1px solid #ccc;
  line-height: 0;
  position: absolute;
  z-index: 10000000000000;
}
</style>
