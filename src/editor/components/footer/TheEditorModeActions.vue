<template>
  <b-button-group>
    <b-button
      size="sm"
      :title="`${t('basic_mode_description')} (b)`"
      :variant="mode === 'basic' ? 'secondary' : 'outline-secondary'"
      :disabled="readability"
      @click="setMode('basic')"
    >
      <b-icon icon="image" aria-hidden="true" />
      <span class="pl-1">{{ t('basic_mode') }}</span>
    </b-button>

    <b-button
      size="sm"
      :title="`${t('code_mode_description')} (c)`"
      :variant="mode === 'code' ? 'secondary' : 'outline-secondary'"
      :disabled="readability"
      @click="setMode('code')"
    >
      <b-icon icon="code" aria-hidden="true" />
      <span class="pl-1">{{ t('code_mode') }}</span>
    </b-button>

    <b-button
      size="sm"
      :title="`${t('magic_mode_description')} (m)`"
      :variant="mode === 'magic' ? 'secondary' : 'outline-secondary'"
      @click="setMode('magic')"
    >
      <b-icon icon="star" aria-hidden="true" />
      <span class="pl-1">{{ t('magic_mode') }}</span>
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import Vue from 'vue';

import { isReaderable } from '@stylebot/readability';

export default Vue.extend({
  name: 'TheEditorModeActions',

  computed: {
    mode(): string {
      return this.$store.state.options.mode;
    },

    // state.readability alone can be true domain-wide while this specific
    // page doesn't qualify (e.g. a MediaWiki main page) — isReaderable()
    // also short-circuits true when the reader is already mounted.
    readability(): boolean {
      return isReaderable() && this.$store.state.readability;
    },
  },

  methods: {
    setMode(mode: string): void {
      this.$store.dispatch('setMode', mode);
    },
  },
});
</script>
