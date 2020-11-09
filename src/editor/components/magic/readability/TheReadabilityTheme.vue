<template>
  <b-button-group>
    <b-button
      size="sm"
      :variant="theme === 'light' ? 'secondary' : 'outline-secondary'"
      :disabled="disabled"
      @click="set('light')"
    >
      {{ t('light_theme') }}
    </b-button>

    <b-button
      size="sm"
      :variant="theme === 'dark' ? 'secondary' : 'outline-secondary'"
      :disabled="disabled"
      @click="set('dark')"
    >
      {{ t('dark_theme') }}
    </b-button>

    <b-button
      size="sm"
      :variant="theme === 'sepia' ? 'secondary' : 'outline-secondary'"
      :disabled="disabled"
      @click="set('sepia')"
    >
      {{ t('sepia_theme') }}
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import Vue from 'vue';
import { ReadabilityTheme } from '@stylebot/types';

export default Vue.extend({
  name: 'TheReadabilityTheme',

  props: {
    disabled: Boolean,
  },

  computed: {
    theme(): ReadabilityTheme {
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
