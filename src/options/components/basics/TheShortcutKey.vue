<template>
  <b-row>
    <div>
      <b-dropdown
        variant="secondary"
        :disabled="disabled"
        :text="shortcutMetaKey"
        class="shortcut-meta-key ml-3"
      >
        <b-dropdown-item
          :key="metaKey.value"
          v-for="metaKey in shortcutMetaKeys"
          @click="setShortcutMetaKey(metaKey.value)"
        >
          {{ metaKey.text }}
        </b-dropdown-item>
      </b-dropdown>
    </div>

    <div class="ml-2" style="display: inline-block">
      <b-form-input
        :disabled="disabled"
        @input="setShortcutKey"
        v-model="shortcutKeyCharacter"
        class="shortcut-key-character"
      />
    </div>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import { StylebotShortcutMetaKey } from '../../../types';
import {
  getOption,
  saveOption,
  getKeydownCode,
  getCharacterFromKeydownCode,
} from '../../utilities';

export default Vue.extend({
  name: 'TheShortcutKey',
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  data(): any {
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

      shortcutKey: 77,
      shortcutMetaKey: 'alt',
      shortcutKeyCharacter: 'M',
    };
  },

  created(): void {
    this.shortcutKey = getOption('shortcutKey');
    this.shortcutMetaKey = getOption('shortcutMetaKey');
    this.shortcutKeyCharacter = getCharacterFromKeydownCode(this.shortcutKey);
  },

  methods: {
    setShortcutKey(): void {
      const keyCode = getKeydownCode(this.shortcutKeyCharacter);
      saveOption('shortcutKey', keyCode);
    },

    setShortcutMetaKey(selectedMetaKey: StylebotShortcutMetaKey): void {
      this.shortcutMetaKey = selectedMetaKey;
      saveOption('shortcutMetaKey', this.shortcutMetaKey);
    },
  },
});
</script>

<style lang="scss">
.shortcut-key-character {
  width: 48px !important;
}

.shortcut-meta-key {
  .dropdown-toggle {
    text-transform: capitalize;
  }
}
</style>
