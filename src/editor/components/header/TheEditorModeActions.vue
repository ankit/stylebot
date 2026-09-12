<template>
  <s-tabs :value="mode" :tabs="tabs" @change="setMode" />
</template>

<script lang="ts">
import Vue from 'vue';
import { STabs } from '@stylebot/components';

export default Vue.extend({
  name: 'TheEditorModeActions',

  components: {
    STabs,
  },

  computed: {
    mode(): string {
      return this.$store.state.options.mode;
    },

    readability(): boolean {
      return this.$store.getters.readabilityActive;
    },

    tabs(): Array<{ value: string; label: string; title: string; disabled: boolean }> {
      return [
        {
          value: 'basic',
          label: this.t('basic_mode'),
          title: `${this.t('basic_mode_description')} (b)`,
          disabled: this.readability,
        },
        {
          value: 'code',
          label: this.t('code_mode'),
          title: `${this.t('code_mode_description')} (c)`,
          disabled: this.readability,
        },
        {
          value: 'magic',
          label: this.t('magic_mode'),
          title: `${this.t('magic_mode_description')} (m)`,
          disabled: false,
        },
      ];
    },
  },

  methods: {
    setMode(mode: string): void {
      this.$store.dispatch('setMode', mode);
    },
  },
});
</script>
