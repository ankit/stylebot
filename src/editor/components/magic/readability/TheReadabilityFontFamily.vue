<template>
  <b-input-group>
    <font-family-dropdown
      :value="value"
      :fonts="fonts"
      :disabled="disabled"
      hide-default
      hide-edit-font-list
      @select="select"
      @preview="preview"
    />
  </b-input-group>
</template>

<script lang="ts">
import Vue from 'vue';

import { StylebotFonts } from '@stylebot/types';
import { readabilityFonts } from '@stylebot/settings';
import { previewReaderFont } from '@stylebot/readability';

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
      return readabilityFonts;
    },
  },

  methods: {
    select(value: string): void {
      this.$store.dispatch('setReadabilitySettings', {
        ...this.$store.state.readabilitySettings,
        font: value,
      });
    },

    preview(font: string | null): void {
      previewReaderFont(font);
    },

    focus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },
  },
});
</script>
