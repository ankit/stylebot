<template>
  <b-button-group>
    <b-button
      size="md"
      title="Basic CSS editor"
      :variant="mode === 'basic' ? 'secondary' : 'outline-secondary'"
      @click="setMode('basic')"
    >
      <b-icon icon="image" aria-hidden="true" />
      <span class="pl-1">Basic</span>
    </b-button>

    <b-button
      size="md"
      title="Code CSS for selector"
      :variant="mode === 'magic' ? 'secondary' : 'outline-secondary'"
      @click="setMode('magic')"
    >
      <b-icon icon="star" aria-hidden="true" />
      <span class="pl-1">Magic</span>
    </b-button>

    <b-button
      size="md"
      title="Code"
      :variant="mode === 'code' ? 'secondary' : 'outline-secondary'"
      @click="setMode('code')"
    >
      <b-icon icon="code" aria-hidden="true" />
      <span class="pl-1">Code</span>
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
