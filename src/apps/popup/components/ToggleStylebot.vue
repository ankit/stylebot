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
    // Set when the site has several profiles, so the button says which one
    // the editor opens on.
    profileName: {
      type: String,
      default: '',
    },
    shortcut: {
      type: String,
      default: '',
    },
  },

  computed: {
    label(): string {
      if (this.isOpen) {
        return this.t('close_stylebot');
      }

      return this.profileName
        ? this.t('edit_name', [this.profileName])
        : this.t('style_this_page');
    },
  },

  methods: {
    toggle(): void {
      if (this.sidePanel && !this.isOpen) {
        openStylebotSidePanel(this.tab);
      } else {
        toggleStylebot(this.tab);
      }
    },
  },
});
</script>
