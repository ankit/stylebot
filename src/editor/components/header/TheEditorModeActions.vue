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

    tabs(): Array<{
      value: string;
      label: string;
      title: string;
      shortcut: string;
      disabled: boolean;
    }> {
      return [
        {
          value: 'basic',
          label: this.t('basic_mode'),
          title: this.t('basic_mode_description'),
          shortcut: 'b',
          disabled: this.readability,
        },
        {
          value: 'code',
          label: this.t('code_mode'),
          title: this.t('code_mode_description'),
          shortcut: 'c',
          disabled: this.readability,
        },
        {
          value: 'magic',
          label: this.t('presets_mode'),
          title: this.t('presets_mode_description'),
          shortcut: 'm',
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
