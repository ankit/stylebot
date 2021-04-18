<template>
  <dropdown-hack-to-support-shadow-dom>
    <b-dropdown
      right
      size="sm"
      variant="button"
      class="color-palette-dropdown"
      toggle-class="text-decoration-none"
    >
      <template #button-content>
        <b-icon icon="droplet" />
      </template>

      <b-dropdown-item @click="setBasicColorPalette">
        <span class="color-palette-dropdown-check-icon">
          <b-icon v-if="basicColorPalette" icon="check" font-scale="1.1" />
        </span>

        Basic
      </b-dropdown-item>

      <b-dropdown-item @click="setMaterialColorPalette">
        <span class="color-palette-dropdown-check-icon">
          <b-icon v-if="materialColorPalette" icon="check" font-scale="1.1" />
        </span>

        Material
      </b-dropdown-item>
    </b-dropdown>
  </dropdown-hack-to-support-shadow-dom>
</template>

<script lang="ts">
import Vue from 'vue';

import DropdownHackToSupportShadowDom from '../DropdownHackToSupportShadowDom.vue';

export default Vue.extend({
  name: 'ColorPalettePicker',

  components: {
    DropdownHackToSupportShadowDom,
  },

  computed: {
    basicColorPalette(): boolean {
      return this.$store.state.options.colorPalette === 'basic';
    },

    materialColorPalette(): boolean {
      return this.$store.state.options.colorPalette === 'material';
    },
  },

  methods: {
    setBasicColorPalette(): void {
      this.$store.dispatch('setColorPalette', 'basic');
    },

    setMaterialColorPalette(): void {
      this.$store.dispatch('setColorPalette', 'material');
    },
  },
});
</script>

<style lang="scss">
.stylebot-app {
  .color-palette-dropdown {
    .btn-sm {
      padding: 0;
    }
  }

  .color-palette-dropdown-check-icon {
    height: 10px;
    width: 16px;
    display: inline-block;
  }
}
</style>
