<template>
  <b-button-group>
    <b-button
      size="md"
      title="Visual CSS editor (b)"
      :variant="mode === 'basic' ? 'secondary' : 'outline-secondary'"
      @click="setMode('basic')"
    >
      <b-icon icon="image" aria-hidden="true" />
      <span class="pl-1">{{ t('basic_mode') }}</span>
    </b-button>

    <b-button
      size="md"
      title="Code (c)"
      :variant="mode === 'code' ? 'secondary' : 'outline-secondary'"
      @click="setMode('code')"
    >
      <b-icon icon="code" aria-hidden="true" />
      <span class="pl-1">{{ t('code_mode') }}</span>
    </b-button>

    <b-button
      size="md"
      title="Experimental features (m)"
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

export default Vue.extend({
  name: 'TheEditorModeActions',

  computed: {
    mode(): string {
      return this.$store.state.options.mode;
    },
  },

  methods: {
    setMode(mode: string): void {
      this.$store.dispatch('setMode', mode);
    },
  },
});
</script>
