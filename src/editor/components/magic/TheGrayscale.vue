<template>
  <div>
    <h1>Grayscale</h1>

    <p class="lead">
      Apply grayscale to make things less distracting.
    </p>

    <b-form-input
      type="range"
      min="0"
      max="100"
      step="1"
      value="0"
      variant="outline-secondary"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'Grayscale',
});
</script>
