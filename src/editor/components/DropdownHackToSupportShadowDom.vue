<template>
  <div @mousedown="mousedown">
    <input ref="hiddenInput" type="text" class="hidden-input" />
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'DropdownHackToSupportShadowDom',

  methods: {
    mousedown(): void {
      // HACK: To make the dropdown work in shadow dom, pending in-depth debugging.
      (this.$refs.hiddenInput as HTMLInputElement).focus();
    },
  },
});
</script>

<style lang="scss" scoped>
.hidden-input {
  width: 0px;
  height: 0px;
  background: transparent;
  position: absolute;
  border: none;
  outline: none !important;
}
</style>
