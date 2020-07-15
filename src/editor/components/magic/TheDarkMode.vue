<template>
  <div>
    <b-form-checkbox v-model="value" switch>Enable Dark Mode</b-form-checkbox>
    <p class="lead pt-2">Apply a dark theme.</p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'DarkMode',

  computed: {
    url(): string {
      return this.$store.state.url;
    },

    value: {
      get(): boolean {
        return this.$store.state.darkMode;
      },

      set(value: boolean): void {
        this.$store.dispatch('applyDarkMode', value);
      },
    },
  },
});
</script>
