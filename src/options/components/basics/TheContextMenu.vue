<template>
  <div>
    <h5>Context Menu</h5>

    <b-form-checkbox v-model="contextMenu" switch>
      Enable Right Click Context Menu
    </b-form-checkbox>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheContextMenu',

  computed: {
    contextMenu: {
      get(): boolean {
        return this.$store.state.options['contextMenu'];
      },

      set(value: boolean): void {
        this.$store.dispatch('setOption', { name: 'contextMenu', value });
      },
    },
  },
});
</script>
