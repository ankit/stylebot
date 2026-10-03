<template>
  <div class="mode-actions">
    <s-tabs ref="tabs" :value="mode" :tabs="tabs" @change="setMode" />

    <s-icon-button
      v-if="chatConnected"
      class="new-chat"
      :size="26"
      :tooltip="t('new_chat')"
      :disabled="!hasTurns"
      @click="newChat"
    >
      <compose-icon :size="16" />
    </s-icon-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SIconButton, STabs } from '@stylebot/components';
import { ComposeIcon } from '@stylebot/icons';

import { KEYBOARD_FOCUS } from '@stylebot/utils';

type TabsRef = { focusSelectedTab(options: FocusOptions): void };

export default Vue.extend({
  name: 'TheEditorModeActions',

  components: {
    ComposeIcon,
    SIconButton,
    STabs,
  },

  computed: {
    mode(): string {
      return this.$store.state.options.mode;
    },

    chatConnected(): boolean {
      return this.mode === 'chat' && !!this.$store.state.chat.status?.connected;
    },

    hasTurns(): boolean {
      return this.$store.state.chat.turns.length > 0;
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
        {
          value: 'chat',
          label: this.t('chat_mode'),
          title: this.t('chat_mode_description'),
          shortcut: 't',
          disabled: this.readability,
        },
      ];
    },
  },

  methods: {
    focusModeTab(): void {
      (this.$refs.tabs as unknown as TabsRef).focusSelectedTab(KEYBOARD_FOCUS);
    },

    newChat(): void {
      this.$store.commit('chat/setConfirmingClear', true);
    },

    setMode(mode: string): void {
      this.$store.dispatch('setMode', mode);
    },
  },
});
</script>

<style lang="scss" scoped>
.mode-actions {
  position: relative;
  margin-top: 16px;
  margin-bottom: -1px;
}

.mode-actions .tabs {
  margin: 0 var(--panel-gutter);
}

.new-chat {
  position: absolute;
  top: 2px;
  right: calc(var(--panel-gutter) - 5px);
  color: var(--icon-color);
}
</style>
