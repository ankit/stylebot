<template>
  <anchored-menu class="color-palette-picker">
    <template #trigger="{ toggle }">
      <icon-button title="Color palette" @click="toggle">
        <droplet-icon />
      </icon-button>
    </template>

    <template #default="{ close }">
      <s-menu dense :min-width="140">
        <menu-item :selected="basicColorPalette" @click="setBasicColorPalette(); close();">
          Basic
        </menu-item>

        <menu-item :selected="materialColorPalette" @click="setMaterialColorPalette(); close();">
          Material
        </menu-item>
      </s-menu>
    </template>
  </anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { AnchoredMenu, SMenu, MenuItem, IconButton } from '@stylebot/components';
import { DropletIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'ColorPalettePicker',

  components: {
    AnchoredMenu,
    SMenu,
    MenuItem,
    IconButton,
    DropletIcon,
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
