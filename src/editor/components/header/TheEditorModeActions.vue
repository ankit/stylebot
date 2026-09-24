<template>
  <div class="mode-actions">
    <s-tabs ref="tabs" :value="mode" :tabs="tabs" @change="setMode" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { STabs } from '@stylebot/components';

import { KEYBOARD_FOCUS } from '@stylebot/utils';

type TabsRef = { focusSelectedTab(options: FocusOptions): void };

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
          shortcut: 'p',
          disabled: false,
        },
      ];
    },
  },

  methods: {
    focusModeTab(): void {
      (this.$refs.tabs as unknown as TabsRef).focusSelectedTab(KEYBOARD_FOCUS);
    },

    setMode(mode: string): void {
      this.$store.dispatch('setMode', mode);
    },
  },
});
</script>

<style lang="scss" scoped>
.mode-actions {
  margin-top: 10px;
}
</style>
