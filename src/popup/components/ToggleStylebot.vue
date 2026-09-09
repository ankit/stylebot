<template>
  <popup-button @click="toggle">
    {{ label }}
    <template v-if="shortcut" #trailing>
      <shortcut-chip small muted :value="shortcut" />
    </template>
  </popup-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { toggleStylebot } from '../utils';
import PopupButton from './PopupButton.vue';
import { ShortcutChip } from '@stylebot/components';

export default Vue.extend({
  name: 'ToggleStylebot',

  components: {
    PopupButton,
    ShortcutChip,
  },

  props: {
    tab: {
      type: Object,
      required: true,
    },

    isOpen: Boolean,
    shortcut: {
      type: String,
      default: '',
    },
  },

  computed: {
    label(): string {
      return this.isOpen
        ? this.t('close_stylebot')
        : this.t('style_this_page');
    },
  },

  methods: {
    toggle(): void {
      toggleStylebot(this.tab);
    },
  },
});
</script>
