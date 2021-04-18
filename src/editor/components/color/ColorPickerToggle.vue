<template>
  <button
    :disabled="disabled"
    class="color-picker-toggle"
    :style="{ background: `${value}` }"
    @click="$emit('click')"
  />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ColorPickerToggle',

  props: {
    value: {
      type: String,
      required: true,
    },
  },

  computed: {
    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },
});
</script>

<style lang="scss" scoped>
.color-picker-toggle {
  width: 45px;
  height: 28px;
  padding: 4px;
  border: none;
  float: left;
  background: #eee;
}
</style>
