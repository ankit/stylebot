<template>
  <div class="basic-color-palette">
    <v-swatches
      v-model="value"
      inline
      swatches="text-advanced"
      :swatch-style="{ boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 10%)' }"
    />
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VSwatches from 'vue-swatches';

export default Vue.extend({
  name: 'BasicColorPalette',

  components: {
    VSwatches,
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
  padding: 10px;
  background: var(--menu-surface);
  border: 1px solid var(--menu-border);
  border-radius: 9px;
  box-shadow: 0 8px 24px var(--menu-shadow);
  line-height: 0;
}
</style>
