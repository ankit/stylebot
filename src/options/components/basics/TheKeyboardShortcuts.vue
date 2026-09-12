<template>
  <div>
    <heading as="h2">{{ t('keyboard_shortcuts') }}</heading>
    <s-text variant="muted" class="description">{{ t('keyboard_shortcuts_description') }}</s-text>

    <div class="rows">
      <shortcut-row :label="t('toggle_editor')">
        <shortcut-recorder-field :value="commands.stylebot" @update="input('stylebot', $event)" />
      </shortcut-row>

      <shortcut-row :label="t('toggle_styling')">
        <shortcut-recorder-field :value="commands.style" @update="input('style', $event)" />
      </shortcut-row>

      <shortcut-row :label="t('toggle_readability')">
        <shortcut-recorder-field :value="commands.readability" @update="input('readability', $event)" />
      </shortcut-row>

      <shortcut-row :label="t('toggle_grayscale')">
        <shortcut-recorder-field :value="commands.grayscale" @update="input('grayscale', $event)" />
      </shortcut-row>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { StylebotCommandName, StylebotCommands } from '@stylebot/types';
import { ShortcutRecorderField, Heading, SText } from '@stylebot/components';

import ShortcutRow from './ShortcutRow.vue';

export default Vue.extend({
  name: 'TheKeyboardShortcuts',

  components: {
    ShortcutRow,
    ShortcutRecorderField,
    Heading,
    SText,
  },

  computed: {
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
