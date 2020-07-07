<template>
  <div>
    <h1>Dark Mode</h1>

    <p class="lead">
      Apply a dark theme to the page.
    </p>

    <b-button size="sm" @click="apply" variant="outline-secondary">
      Apply
    </b-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'DarkMode',

  methods: {
    apply(): void {
      this.$store.dispatch('applyDarkMode');
    },
  },
});
</script>
