<template>
  <popup-row hover>
    <span v-if="indent" class="check-slot" />
    <s-toggle-switch v-model="readability" track-end @change="onChange">
      <span class="readability-label">
        <s-text as="span" size="large">{{ t('readability') }}</s-text>
        <span v-if="shortcut" class="shortcut-hint">
          <s-shortcut-kbd :value="shortcut" />
        </span>
      </span>
    </s-toggle-switch>
  </popup-row>
</template>

<script lang="ts">
import Vue from 'vue';
import type { ToggleReadabilityForTab } from '@stylebot/types';
import PopupRow from './PopupRow.vue';
import { SShortcutKbd, SText, SToggleSwitch } from '@stylebot/components';

export default Vue.extend({
  name: 'Readability',

  components: {
    PopupRow,
    SToggleSwitch,
    SShortcutKbd,
    SText,
  },

  props: {
    tab: {
      type: Object,
      required: true,
    },

    initialReadability: Boolean,
    // Lines the label up with the profile names above it.
    indent: Boolean,
    shortcut: {
      type: String,
      default: '',
    },
  },

  data(): {
    readability: boolean;
  } {
    return {
      readability: this.initialReadability,
    };
  },

  watch: {
    initialReadability(newVal: boolean): void {
      this.readability = newVal;
    },
  },

  methods: {
    onChange(): void {
      this.$emit('change', this.readability);

      if (this.tab.id) {
        const message: ToggleReadabilityForTab = {
          name: 'ToggleReadabilityForTab',
        };

        chrome.tabs.sendMessage(this.tab.id, message);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.check-slot {
  flex: none;
  width: 14px;
}

.readability-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shortcut-hint {
  display: inline-flex;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.12s ease;
}

.popup-row:hover .shortcut-hint,
.popup-row:focus-within .shortcut-hint {
  opacity: 1;
}
</style>
