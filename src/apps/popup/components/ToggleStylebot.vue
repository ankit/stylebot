<template>
  <s-pill-button @click="toggle">
    {{ label }}
    <template v-if="shortcut" #trailing>
      <s-shortcut-chip muted :value="shortcut" class="shortcut-hint" />
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
    // Set when the profile the editor opens on has a name, so the button
    // says which one.
    profileName: {
      type: String,
      default: '',
    },
    hasStyle: Boolean,
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

      if (this.profileName) {
        return this.t('edit_name', [this.profileName]);
      }

      return this.hasStyle ? this.t('edit_style') : this.t('style_this_page');
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

<style lang="scss" scoped>
.shortcut-hint {
  opacity: 0;
  transition: opacity 0.12s ease;
}

.pill-btn:hover .shortcut-hint,
.pill-btn:focus-within .shortcut-hint {
  opacity: 1;
}
</style>
