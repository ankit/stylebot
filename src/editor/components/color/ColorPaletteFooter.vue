<template>
  <div>
    <color-palette-picker class="color-palette-picker mt-1" />
    <color-input v-model="value" class="color-input mt-1 ml-2" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import ColorInput from './ColorInput.vue';
import ColorPalettePicker from './ColorPalettePicker.vue';

export default Vue.extend({
  name: 'ColorPaletteFooter',

  components: {
    ColorInput,
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

<style lang="scss" scoped>
.color-palette-picker {
  float: left;
  margin-left: -2px;
}

.color-input {
  float: right;
}
</style>
