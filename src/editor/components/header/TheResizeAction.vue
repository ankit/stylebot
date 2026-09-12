<template>
  <icon-button :size="32" :title="`${t('resize')} (${resizeCommand})`" @click="toggleResize">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 2v12" />
      <path d="M4.5 5.5L2 8l2.5 2.5" />
      <path d="M11.5 5.5L14 8l-2.5 2.5" />
    </svg>
  </icon-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { IconButton } from '@stylebot/components';

export default Vue.extend({
  name: 'TheResizeAction',

  components: {
    IconButton,
  },

  computed: {
    resizing(): boolean {
      return this.$store.state.resizing;
    },

    resizeCommand(): string {
      return this.$store.state.editorCommands.resize;
    },
  },

  methods: {
    toggleResize(): void {
      this.$store.commit('setResizing', !this.resizing);
    },
  },
});
</script>
