<template>
  <div>
    <h2>Keyboard Shortcuts</h2>

    <b-row align-v="center" class="mb-4">
      <b-col cols="12" class="help">
        <kbd>shift</kbd>
        <kbd>option</kbd>
        <kbd>alt</kbd>
        <kbd>ctrl</kbd>
        <kbd>command</kbd>
        +
        <kbd>a-z</kbd>
      </b-col>
    </b-row>

    <shortcut
      id="stylebot"
      label="Toggle Stylebot Editor"
      @input="input('stylebot', $event)"
    />

    <shortcut
      id="style"
      label="Toggle Styling"
      @input="input('style', $event)"
    />

    <shortcut
      id="readability"
      label="Toggle Readability"
      @input="input('readability', $event)"
    />

    <shortcut
      id="grayscale"
      label="Toggle Grayscale"
      @input="input('grayscale', $event)"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { StylebotCommandName } from '@stylebot/types';

import Shortcut from './Shortcut.vue';

export default Vue.extend({
  name: 'TheKeyboardShortcuts',

  components: {
    Shortcut,
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
kbd {
  font-size: 11px;
  margin: 0 1px;
  display: inline-block;
  height: 20px;
}

.help {
  color: #555;
  font-size: 12px;
}
</style>
