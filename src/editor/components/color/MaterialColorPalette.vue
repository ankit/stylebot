<template>
  <div class="material-color-palette">
    <v-swatches
      v-model="value"
      inline
      :swatch-size="18"
      :spacing-size="0"
      :swatches="swatches"
      :swatch-style="{ borderRadius: 0, boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 10%)' }"
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
  background: var(--menu-surface);
  border: 1px solid var(--menu-border);
  border-radius: 9px;
  box-shadow: 0 8px 24px var(--menu-shadow);
  line-height: 0;
}
</style>
