<template>
  <b-input-group>
    <font-family-dropdown
      :value="value"
      :fonts="fonts"
      :disabled="disabled"
      hide-default
      @select="select"
    />
  </b-input-group>
</template>

<script lang="ts">
import Vue from 'vue';

import { StylebotFonts } from '@stylebot/types';

import FontFamilyDropdown from '../../text/FontFamilyDropdown.vue';

export default Vue.extend({
  name: 'TheReadabilityFontFamily',

  components: {
    FontFamilyDropdown,
  },

  props: {
    disabled: Boolean,
  },

  computed: {
    value: {
      get(): string {
        return this.$store.state.readabilitySettings.font;
      },

      set(value: string) {
        this.$store.dispatch('setReadabilitySettings', {
          ...this.$store.state.readabilitySettings,
          font: value,
        });
      },
    },

    fonts(): StylebotFonts {
      return this.$store.state.options.fonts;
    },
  },

  methods: {
    select(value: string): void {
      this.$store.dispatch('setReadabilitySettings', {
        ...this.$store.state.readabilitySettings,
        font: value,
      });
    },

    focus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },
  },
});
</script>
