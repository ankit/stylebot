<template>
  <div>
    <p class="lead">{{ t('grayscale_description') }}</p>

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
