<template>
  <b-button-group>
    <b-button
      size="sm"
      title="Basic CSS editor"
      @click="$emit('update', 'basic')"
      :variant="mode === 'basic' ? 'secondary' : 'outline-secondary'"
    >
      <b-icon icon="image" aria-hidden="true" />
      Basic
    </b-button>

    <b-button
      size="sm"
      title="Code CSS for selector"
      @click="$emit('update', 'selector')"
      :variant="mode === 'selector' ? 'secondary' : 'outline-secondary'"
    >
      <b-icon icon="code" aria-hidden="true" />
      Selector
    </b-button>

    <b-button
      size="sm"
      title="Code CSS for page"
      @click="$emit('update', 'page')"
      :variant="mode === 'page' ? 'secondary' : 'outline-secondary'"
    >
      <b-icon icon="file-code" aria-hidden="true" />
      Page
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheEditorModeActions',
  props: ['mode'],
});
</script>
