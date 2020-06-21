<template>
  <div class="v-basics-tab">
    <h2 class="title">Shortcut Key</h2>

    <v-switch
      @input="saveUseShortcutKey"
      v-model="options.useShortcutKey"
      label="Enable shortcut key to launch Stylebot"
    />

    <v-row>
      <v-col cols="6">
        <v-select
          solo
          class="mr-2 shortcut-meta-key"
          :items="shortcutMetaKeys"
          v-model="options.shortcutMetaKey"
          @change="saveShortcutMetaKey"
        />

        <v-text-field
          solo
          counter="1"
          @input="saveShortcutKey"
          v-model="shortcutKeyCharacter"
          class="shortcut-key-character"
        />
      </v-col>
    </v-row>

    <h2 class="title">Default Editing Mode</h2>

    <v-radio-group v-model="options.mode" @change="saveEditingMode">
      <v-radio value="Basic" label="Basic" />
      <v-radio value="Advanced" label="Advanced" />
      <v-radio value="Edit CSS" label="Edit CSS" />
    </v-radio-group>

    <h2 class="title">Context Menu</h2>

    <v-switch
      @change="saveRightClickMenu"
      v-model="options.contextMenu"
      label="Show Right Click Context Menu"
    />
  </div>
</template>

<script lang="ts">
import { StylebotOptions, StylebotShortcutMetaKey } from '../types';

import {
  getOptions,
  saveOption,
  getKeydownCode,
  getCharacterFromKeydownCode,
} from '../utilities';

export default {
  name: 'TheBasicsTab',
  data(): {
    options?: StylebotOptions;
    shortcutKeyCharacter?: string;
    shortcutMetaKeys: Array<{ text: string; value: StylebotShortcutMetaKey }>;
  } {
    return {
      shortcutMetaKeys: [
        {
          text: 'Ctrl',
          value: 'ctrl',
        },
        {
          text: 'Shift',
          value: 'shift',
        },
        {
          text: 'Alt',
          value: 'alt',
        },
        {
          text: 'None',
          value: 'none',
        },
      ],
    };
  },

  async created(): Promise<void> {
    this.options = getOptions();
    this.shortcutKeyCharacter = getCharacterFromKeydownCode(
      this.options.shortcutKey
    );
  },

  methods: {
    saveRightClickMenu(): void {
      saveOption('contextMenu', this.options.contextMenu);
    },
    saveEditingMode(): void {
      saveOption('mode', this.options.mode);
    },
    saveUseShortcutKey(): void {
      saveOption('useShortcutKey', this.options.useShortcutKey);
    },
    saveShortcutKey(): void {
      const code = getKeydownCode(this.shortcutKeyCharacter);
      saveOption('shortcutKey', code);
    },
    saveShortcutMetaKey(): void {
      saveOption('shortcutMetaKey', this.options.shortcutMetaKey);
    },
  },
};
</script>

<style scoped>
.shortcut-meta-key {
  width: 120px;
  display: inline-block;
}

.shortcut-key-character {
  width: 48px;
  display: inline-block;
}
</style>