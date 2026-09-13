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

    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VSwatches from 'vue-swatches';
import { materialSwatches as swatches } from '../../utils/swatches';

export default Vue.extend({
  name: 'MaterialColorPalette',

  components: {
    VSwatches,
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
  padding: 10px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 9px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  line-height: 0;
}
</style>
