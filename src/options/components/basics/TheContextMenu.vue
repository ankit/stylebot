<template>
  <div>
    <h2>{{ t('context_menu') }}</h2>

    <b-form-checkbox v-model="contextMenu" switch>
      {{ t('enable_right_click_menu') }}
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
