<template>
  <s-pill-button @click="toggle">
    {{ label }}
    <template v-if="shortcut" #trailing>
      <s-shortcut-chip muted :value="shortcut" />
    </template>
  </s-pill-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { toggleStylebot, openStylebotSidePanel } from '../utils';
import { SPillButton, SShortcutChip } from '@stylebot/components';
import type { StylebotAppearance } from '@stylebot/types';

export default Vue.extend({
  name: 'ToggleStylebot',

  components: {
    SPillButton,
    SShortcutChip,
  },

  props: {
    tab: {
      type: Object,
      required: true,
    },

    isOpen: Boolean,
    sidePanel: Boolean,
    appearance: {
      type: String,
      default: 'system',
    },
    shortcut: {
      type: String,
      default: '',
    },
  },

  computed: {
    label(): string {
      return this.isOpen ? this.t('close_stylebot') : this.t('style_this_page');
    },
  },

  methods: {
    toggle(): void {
      if (this.sidePanel && !this.isOpen) {
        openStylebotSidePanel(this.tab, this.appearance as StylebotAppearance);
      } else {
        toggleStylebot(this.tab);
      }
    },
  },
});
</script>
