<template>
  <popup-row hover :disabled="disabled">
    <toggle-switch
      v-model="readability"
      :disabled="disabled"
      @change="onChange"
    >
      {{ t('readability') }}
      <template v-if="disabled" #trailing>
        <span class="popup-caption articles-only-label">{{
          t('articles_only')
        }}</span>
      </template>
      <template v-else-if="shortcut" #trailing>
        <shortcut-chip small muted :value="shortcut" />
      </template>
    </toggle-switch>
  </popup-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { ToggleReadabilityForTab } from '@stylebot/types';
import PopupRow from './PopupRow.vue';
import ToggleSwitch from './ToggleSwitch.vue';
import ShortcutChip from '../../readability/components/dock/ShortcutChip.vue';

export default Vue.extend({
  name: 'Readability',

  components: {
    PopupRow,
    ToggleSwitch,
    ShortcutChip,
  },

  props: {
    initialReadability: Boolean,
    disabled: Boolean,
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

      chrome.tabs.query({ active: true }, ([tab]) => {
        if (tab.id) {
          const message: ToggleReadabilityForTab = {
            name: 'ToggleReadabilityForTab',
          };

          chrome.tabs.sendMessage(tab.id, message);
        }
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.articles-only-label {
  flex: none;
}
</style>
