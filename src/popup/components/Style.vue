<template>
  <div
    v-if="header"
    class="popup-header"
    :class="{ disabled: disableToggle }"
    @click="onHeaderClick"
  >
    <toggle-switch
      v-model="enabled"
      size="lg"
      :disabled="disableToggle"
      @change="onChange"
    >
      <div class="popup-header-domain">{{ url }}</div>
      <template #trailing>
        <shortcut-chip v-if="shortcut" small muted :value="shortcut" />
      </template>
    </toggle-switch>
  </div>

  <popup-row v-else hover :disabled="disableToggle">
    <toggle-switch
      v-model="enabled"
      :disabled="disableToggle"
      @change="onChange"
    >
      {{ url }}
    </toggle-switch>
  </popup-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { EnableStyle, DisableStyle } from '@stylebot/types';
import PopupRow from './PopupRow.vue';
import ToggleSwitch from './ToggleSwitch.vue';
import { ShortcutChip } from '@stylebot/components';
import { forwardClickToInput } from '../utils';

export default Vue.extend({
  name: 'Style',

  components: {
    PopupRow,
    ToggleSwitch,
    ShortcutChip,
  },

  props: {
    url: {
      type: String,
      required: true,
    },
    disableToggle: {
      type: Boolean,
    },
    initialEnabled: {
      type: Boolean,
    },
    header: {
      type: Boolean,
    },
    shortcut: {
      type: String,
      default: '',
    },
  },

  data(): {
    enabled: boolean;
  } {
    return {
      enabled: this.initialEnabled,
    };
  },

  methods: {
    onHeaderClick(event: MouseEvent): void {
      if (this.disableToggle) {
        return;
      }

      forwardClickToInput(event, this.$el);
    },

    onChange(): void {
      if (this.enabled) {
        this.enable();
      } else {
        this.disable();
      }
    },

    enable(): void {
      const message: EnableStyle = {
        name: 'EnableStyle',
        url: this.url,
      };

      chrome.runtime.sendMessage(message);
    },

    disable(): void {
      const message: DisableStyle = {
        name: 'DisableStyle',
        url: this.url,
      };

      chrome.runtime.sendMessage(message);
    },
  },
});
</script>

<style lang="scss" scoped>
.popup-header {
  cursor: pointer;

  &.disabled {
    cursor: default;
  }
}
</style>
