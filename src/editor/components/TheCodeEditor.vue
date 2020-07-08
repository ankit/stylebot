<template>
  <the-monaco-editor :css="css" :position="position" @update="update" />
</template>

<script lang="ts">
import Vue from 'vue';
import TheMonacoEditor from './code/TheMonacoEditor.vue';
import { StylebotPlacement } from '../../types';

export default Vue.extend({
  name: 'TheCodeEditor',
  components: {
    TheMonacoEditor,
  },

  computed: {
    css(): string {
      return this.$store.state.css;
    },

    position(): StylebotPlacement {
      return this.$store.state.position;
    },
  },

  methods: {
    update(css: string): void {
      this.$store.dispatch('applyCss', { css });
    },
  },
});
</script>
