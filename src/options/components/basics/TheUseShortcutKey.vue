<template>
  <div>
    <h5>Shortcut Key</h5>

    <b-form-checkbox switch v-model="useShortcutKey">
      Enable shortcut key to launch Stylebot
    </b-form-checkbox>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheUseShortcutKey',

  computed: {
    useShortcutKey: {
      get(): boolean {
        return this.$store.state.options['useShortcutKey'];
      },

      set(value: boolean): void {
        this.$store.dispatch('setOption', { name: 'useShortcutKey', value });
      },
    },
  },
});
</script>
