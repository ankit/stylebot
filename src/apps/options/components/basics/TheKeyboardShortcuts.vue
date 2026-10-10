<template>
  <div>
    <div class="header">
      <div class="title-block">
        <s-heading as="h2" size="lg">{{ t('keyboard_shortcuts') }}</s-heading>
        <s-text variant="muted" class="description">
          {{
            safari
              ? t('change_shortcuts_in_safari_settings_extensions')
              : t('shortcuts_are_set_in_your_browser')
          }}
        </s-text>
      </div>

      <s-button v-if="!safari" @click="openShortcutsPage">
        {{ t('change_shortcuts') }}
      </s-button>
    </div>

    <s-list class="rows">
      <shortcut-row
        v-for="row in rows"
        :key="row.settingKey"
        :label="t(row.labelKey)"
      >
        <s-shortcut-chip
          v-if="commands[row.settingKey]"
          :value="commands[row.settingKey]"
        />
        <s-text v-else variant="muted">{{ t('not_set') }}</s-text>
      </shortcut-row>
    </s-list>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { StylebotCommandName, StylebotCommands } from '@stylebot/types';
import {
  SButton,
  SHeading,
  SList,
  SShortcutChip,
  SText,
} from '@stylebot/components';
import { isSafari, openShortcutsPage } from '@stylebot/utils';

import ShortcutRow from './ShortcutRow.vue';

type ShortcutSetting = { labelKey: string; settingKey: StylebotCommandName };

export default Vue.extend({
  name: 'TheKeyboardShortcuts',

  components: {
    ShortcutRow,
    SButton,
    SHeading,
    SList,
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
.header {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.title-block {
  flex: 1;
  min-width: 0;
}

.description {
  margin-top: 6px;
}

.rows {
  margin-top: 16px;
}
</style>
