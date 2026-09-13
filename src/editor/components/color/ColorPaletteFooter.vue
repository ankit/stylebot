<template>
  <div class="color-palette-footer">
    <color-palette-picker />
    <color-input v-model="value" />
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
.color-palette-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}
</style>
