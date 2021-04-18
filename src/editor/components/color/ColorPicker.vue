<template>
  <b-row no-gutters class="color-picker">
    <b-col cols="12">
      <div class="stylebot-color-picker">
        <basic-color-palette v-if="open && basicColorPalette" v-model="value" />

        <material-color-palette
          v-if="open && materialColorPalette"
          v-model="value"
        />
      </div>

      <color-picker-toggle v-model="value" @click="onOpen" />
      <color-input v-model="value" class="ml-2" />
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

import ColorInput from './ColorInput.vue';
import ColorPickerToggle from './ColorPickerToggle.vue';
import BasicColorPalette from './BasicColorPalette.vue';
import MaterialColorPalette from './MaterialColorPalette.vue';

export default Vue.extend({
  name: 'ColorPicker',

  components: {
    ColorInput,
    ColorPickerToggle,
    BasicColorPalette,
    MaterialColorPalette,
  },

  props: {
    property: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      open: false,
    };
  },

  computed: {
    value: {
      get(): string {
        const activeRule = this.$store.getters.activeRule;

        let value = '';
        if (activeRule) {
          activeRule.clone().walkDecls(this.property, (decl: Declaration) => {
            value = decl.value;
          });
        }

        return value;
      },

      set(value: string): void {
        this.$store.dispatch('applyDeclaration', {
          property: this.property,
          value,
        });
      },
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },

    basicColorPalette(): boolean {
      return this.$store.state.options.colorPalette === 'basic';
    },

    materialColorPalette(): boolean {
      return this.$store.state.options.colorPalette === 'material';
    },
  },

  methods: {
    onFocus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },

    onOpen(): void {
      this.open = true;
      this.$store.commit('setColorPickerVisible', true);

      setTimeout(() => {
        document.addEventListener('click', this.onDocumentClick);
      }, 0);
    },

    onClose(): void {
      this.open = false;
      this.$store.commit('setColorPickerVisible', false);

      setTimeout(() => {
        document.removeEventListener('click', this.onDocumentClick);
      }, 0);
    },

    onDocumentClick(e: MouseEvent): void {
      const colorPickerSwatches = e.composedPath().find(el => {
        return (el as HTMLElement).className?.includes('stylebot-color-picker');
      });

      if (!colorPickerSwatches) {
        this.onClose();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.color-picker {
  pointer-events: all;
}
</style>
