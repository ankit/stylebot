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
          v-for="metaKey in allShortcutMetaKeys"
          @click="setShortcutMetaKey(metaKey.value)"
        >
          {{ metaKey.text }}
        </b-dropdown-item>
      </b-dropdown>
    </div>

    <div class="ml-2" style="display: inline-block">
      <b-form-input
        :disabled="disabled"
        v-model="shortcutKeyCharacter"
        class="shortcut-key-character"
      />
    </div>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import { StylebotShortcutMetaKey } from '../../../types';
import { getKeydownCode, getCharacterFromKeydownCode } from '../../utils';

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
      allShortcutMetaKeys: [
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

  computed: {
    shortcutKeyCharacter: {
      get(): string {
        const shortcutKey = this.$store.state.options['shortcutKey'];
        return getCharacterFromKeydownCode(shortcutKey);
      },

      set(shortcutKeyCharacter: string): void {
        const shortcutKey = getKeydownCode(shortcutKeyCharacter);

        this.$store.dispatch('setOption', {
          name: 'shortcutKey',
          value: shortcutKey,
        });
      },
    },

    shortcutMetaKey(): StylebotShortcutMetaKey {
      return this.$store.state.options['shortcutMetaKey'];
    },
  },

  methods: {
    setShortcutMetaKey(value: StylebotShortcutMetaKey): void {
      this.$store.dispatch('setOption', { name: 'shortcutMetaKey', value });
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
