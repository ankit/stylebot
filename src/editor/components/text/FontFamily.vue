<template>
  <b-row align-content="center" no-gutters>
    <css-property>Font</css-property>

    <css-property-value>
      <b-row no-gutters>
        <b-col cols="10">
          <b-input-group class="font-input-group">
            <b-form-input
              v-model="value"
              size="sm"
              :debounce="400"
              :disabled="disabled"
              @focus="focus"
            />

            <font-family-dropdown
              :fonts="fonts"
              :disabled="disabled"
              @select="select"
            />
          </b-input-group>
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

export default Vue.extend({
  name: 'FontFamily',

  components: {
    CssProperty,
    CssPropertyValue,
    FontFamilyDropdown,
  },

  data(): { fonts: Array<string> } {
    return {
      fonts: [
        'Calibri',
        'Crimson Text',
        'Droid Sans',
        'Droid Serif',
        'Fira Code',
        'Helvetica',
        'Inconsolata',
        'Lato',
        'Lora',
        'Merriweather',
        'Monaco',
        'Muli',
        'Roboto',
      ],
    };
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
