<template>
  <div>
    <h1>Grayscale</h1>
    <p class="lead">
      Apply grayscale to make things less distracting.
    </p>

    <b-form-input
      v-model="value"
      type="range"
      min="0"
      max="100"
      step="1"
      variant="outline-secondary"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheGrayscale',

  computed: {
    value: {
      get(): number {
        return this.$store.getters.grayscale;
      },

      set(percent: number): void {
        this.$store.dispatch('applyFilter', {
          effectName: 'grayscale',
          percent,
        });
      },
    },
  },
});
</script>
