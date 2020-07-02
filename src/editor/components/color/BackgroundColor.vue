<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Background Color
    </css-property>

    <css-property-value>
      <b-row>
        <b-col cols="3">
          <color-picker
            :color="backgroundColor"
            @colorSelection="colorPickerInput($event)"
          />
        </b-col>

        <b-col cols="9">
          <b-form-input
            size="sm"
            :value="backgroundColor"
            @input="colorInput($event)"
          />
        </b-col>
      </b-row>
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import ColorPicker from './ColorPicker.vue';
import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

export default Vue.extend({
  name: 'BackgroundColor',

  components: {
    ColorPicker,
    CssProperty,
    CssPropertyValue,
  },

  computed: {
    backgroundColor(): string {
      const activeRule = this.$store.state.activeRule;

      let color = '';
      if (activeRule) {
        activeRule.clone().walkDecls('background-color', decl => {
          color = decl.value;
        });
      }

      return color;
    },
  },

  methods: {
    colorPickerInput(color: { hex: string }): void {
      this.$store.dispatch('applyDeclaration', {
        property: 'background-color',
        value: color.hex,
      });
    },

    colorInput(color: string): void {
      this.$store.dispatch('applyDeclaration', {
        property: 'background-color',
        value: color,
      });
    },
  },
});
</script>
