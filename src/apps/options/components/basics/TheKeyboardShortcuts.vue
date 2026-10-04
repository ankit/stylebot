<template>
  <div>
    <s-heading as="h2" size="lg">{{ t('keyboard_shortcuts') }}</s-heading>
    <s-text variant="muted" class="description">
      {{ t('shortcuts_are_set_in_your_browser') }}
    </s-text>

    <div class="rows">
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
    </div>

    <s-button v-if="canChange" class="change" @click="openShortcutsPage">
      {{ t('change_shortcuts') }}
    </s-button>
    <s-text v-else variant="muted" class="change">
      {{ t('change_shortcuts_in_safari_settings_extensions') }}
    </s-text>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { StylebotCommandName, StylebotCommands } from '@stylebot/types';
import { SButton, SShortcutChip, SHeading, SText } from '@stylebot/components';
import { canOpenShortcutsPage, openShortcutsPage } from '@stylebot/utils';

import ShortcutRow from './ShortcutRow.vue';

type ShortcutSetting = { labelKey: string; settingKey: StylebotCommandName };

export default Vue.extend({
  name: 'TheKeyboardShortcuts',

  components: {
    ShortcutRow,
    SButton,
    SShortcutChip,
    SHeading,
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

    canChange(): boolean {
      return canOpenShortcutsPage();
    },
  },

  methods: {
    openShortcutsPage,
  },
});
</script>

<style lang="scss" scoped>
.description {
  margin-top: 4px;
  max-width: 520px;
}

.rows {
  margin-top: 12px;
}

.change {
  margin-top: 12px;
}
</style>
