<template>
  <b-button-group>
    <b-button
      size="sm"
      :variant="theme === 'light' ? 'secondary' : 'outline-secondary'"
      @click="set('light')"
    >
      Light
    </b-button>

    <b-button
      size="sm"
      :variant="theme === 'dark' ? 'secondary' : 'outline-secondary'"
      @click="set('dark')"
    >
      Dark
    </b-button>

    <b-button
      size="sm"
      :variant="theme === 'sepia' ? 'secondary' : 'outline-secondary'"
      @click="set('sepia')"
    >
      Sepia
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import Vue from 'vue';
import { ReadabilityTheme } from '@stylebot/types';

export default Vue.extend({
  name: 'TheReadabilityTheme',

  computed: {
    theme(): number {
      return this.$store.state.readabilitySettings.theme;
    },
  },

  methods: {
    set(theme: ReadabilityTheme) {
      this.$store.dispatch('setReadabilitySettings', {
        ...this.$store.state.readabilitySettings,
        theme,
      });
    },
  },
});
</script>
