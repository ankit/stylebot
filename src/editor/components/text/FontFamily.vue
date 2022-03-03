<template>
  <b-row align-content="center" no-gutters>
    <css-property>{{ t('font_family') }}</css-property>

    <css-property-value>
      <b-row no-gutters>
        <b-col cols="10">
          <font-family-dropdown
            :value="value"
            :fonts="fonts"
            :disabled="disabled"
            @select="select"
          />
        </b-col>
      </b-row>
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';
import FontFamilyDropdown from './FontFamilyDropdown.vue';
import { StylebotFonts } from 'types';

export default Vue.extend({
  name: 'FontFamily',

  components: {
    CssProperty,
    CssPropertyValue,
    FontFamilyDropdown,
  },

  computed: {
    value: {
      get(): string {
        const activeRule = this.$store.getters.activeRule;
        let value = '';

        if (activeRule) {
          activeRule.clone().walkDecls('font-family', (decl: Declaration) => {
            value = decl.value;
          });
        }

        return value;
      },

      set(value: string) {
        this.$store.dispatch('applyFontFamily', value);
      },
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },

    fonts(): StylebotFonts {
      return this.$store.state.options.fonts;
    },
  },

  methods: {
    select(value: string): void {
      this.$store.dispatch('applyFontFamily', value);
    },

    focus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },
  },
});
</script>

<style lang="scss" scoped>
.form-control {
  border-right: none !important;
}
</style>
