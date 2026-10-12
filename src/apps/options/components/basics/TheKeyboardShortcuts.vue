<template>
  <basics-section :label="t('keyboard_shortcuts')">
    <template #action>
      <s-text v-if="safari" variant="muted" class="action">
        {{ t('change_shortcuts_in_safari_settings_extensions') }}
      </s-text>
      <s-link-button v-else class="action" @click="openShortcutsPage">
        {{ t('change_in_browser_settings') }}
      </s-link-button>
    </template>

    <shortcut-row
      v-for="row in rows"
      :key="row.settingKey"
      :label="t(row.labelKey)"
    >
      <s-shortcut-chip
        v-if="commands[row.settingKey]"
        :value="commands[row.settingKey]"
      />
      <s-text v-else-if="safari" variant="muted">{{ t('not_set') }}</s-text>
      <s-link-button v-else class="not-set" @click="openShortcutsPage">
        {{ t('not_set') }}
      </s-link-button>
    </shortcut-row>
  </basics-section>
</template>

<script lang="ts">
import Vue from 'vue';
import type { StylebotCommandName, StylebotCommands } from '@stylebot/types';
import { SLinkButton, SShortcutChip, SText } from '@stylebot/components';
import { isSafari, openShortcutsPage } from '@stylebot/utils';

import BasicsSection from './BasicsSection.vue';
import ShortcutRow from './ShortcutRow.vue';

type ShortcutSetting = { labelKey: string; settingKey: StylebotCommandName };

export default Vue.extend({
  name: 'TheKeyboardShortcuts',

  components: {
    BasicsSection,
    ShortcutRow,
    SLinkButton,
    SShortcutChip,
    SText,
  },

  computed: {
    rows(): Array<ShortcutSetting> {
      return [
        { labelKey: 'toggle_editor', settingKey: 'stylebot' },
        { labelKey: 'toggle_styling', settingKey: 'style' },
        { labelKey: 'toggle_readability', settingKey: 'readability' },
        { labelKey: 'toggle_grayscale', settingKey: 'grayscale' },
      ];
    },

    commands(): StylebotCommands {
      return this.$store.state.commands;
    },

    // Safari keeps extension shortcuts in its own settings, which no API opens.
    safari(): boolean {
      return isSafari();
    },
  },

  methods: {
    openShortcutsPage,
  },
});
</script>

<style lang="scss" scoped>
.action {
  font-size: 13px;
  line-height: 1.2;
}

.basics-section .not-set {
  font-weight: 400;
  color: var(--text-muted);
}
</style>
