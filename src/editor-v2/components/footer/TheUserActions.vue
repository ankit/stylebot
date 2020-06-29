<template>
  <b-button-group>
    <b-button title="Undo" variant="outline-secondary" size="sm">
      <b-icon icon="arrow-counterclockwise" aria-hidden="true" />
      Undo
    </b-button>

    <b-button title="Reset Element CSS" variant="outline-secondary" size="sm">
      <b-icon icon="trash" aria-hidden="true" />
      Reset
    </b-button>

    <b-button title="Reset Page CSS" variant="outline-secondary" size="sm">
      <b-icon icon="trash" aria-hidden="true" />
      Reset Page
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheUserActions',
});
</script>
