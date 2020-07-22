<template>
  <div>
    <b-form-checkbox v-model="value" switch>Enable Readability</b-form-checkbox>

    <p class="lead pt-2">
      Make articles on this site readable by hiding non-essential page elements
      like sidebars, footers and ads.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'Readability',

  computed: {
    value: {
      get(): boolean {
        return this.$store.state.readability;
      },

      set(value: boolean): void {
        this.$store.dispatch('applyReadability', value);
      },
    },
  },
});
</script>
