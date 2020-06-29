<template>
  <b-button-group>
    <b-button title="Basic" variant="secondary" size="sm">
      <b-icon icon="image" aria-hidden="true" />
      Basic
    </b-button>

    <b-button title="Advanced" variant="outline-secondary" size="sm">
      <b-icon icon="code" aria-hidden="true" />
      Selector
    </b-button>

    <b-button title="Advanced" variant="outline-secondary" size="sm">
      <b-icon icon="file-code" aria-hidden="true" />
      Page
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheEditorModeActions',
});
</script>
