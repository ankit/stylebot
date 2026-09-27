<template>
  <div>
    <s-heading as="h2" size="lg">{{ t('keyboard_shortcuts') }}</s-heading>
    <s-text variant="muted" class="description">
      {{ t('keyboard_shortcuts_description') }}
    </s-text>

    <div class="rows">
      <shortcut-row
        v-for="row in rows"
        :key="row.settingKey"
        :label="t(row.labelKey)"
      >
        <s-shortcut-recorder-field
          :value="commands[row.settingKey]"
          @update="input(row.settingKey, $event)"
        />
      </shortcut-row>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { StylebotCommandName, StylebotCommands } from '@stylebot/types';
import { SShortcutRecorderField, SHeading, SText } from '@stylebot/components';

import ShortcutRow from './ShortcutRow.vue';

type ShortcutSetting = { labelKey: string; settingKey: StylebotCommandName };

export default Vue.extend({
  name: 'TheKeyboardShortcuts',

  components: {
    ShortcutRow,
    SShortcutRecorderField,
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
  },

  methods: {
    input(name: StylebotCommandName, value: string) {
      const commands = { ...this.$store.state.commands };
      commands[name] = value;
      this.$store.dispatch('setCommands', commands);
    },
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
</style>
