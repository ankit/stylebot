<template>
  <s-anchored-menu class="popup-more-menu">
    <template #trigger="{ toggle }">
      <s-icon-button :size="28" :aria-label="t('more')" @click="toggle">
        <more-icon />
      </s-icon-button>
    </template>

    <s-menu dense size="small" class="more-list">
      <s-menu-item @click="openOptions">{{ t('view_options') }}</s-menu-item>
      <s-menu-item @click="openHelp">{{ t('help_options') }}</s-menu-item>

      <s-menu-item @click="openFeedback">
        {{ t('send_feedback') }}
      </s-menu-item>
    </s-menu>
  </s-anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import { MoreIcon } from '@stylebot/icons';
import {
  SAnchoredMenu,
  SIconButton,
  SMenu,
  SMenuItem,
} from '@stylebot/components';

import { openFeedback, openHelp, openOptions } from '../utils';

export default Vue.extend({
  name: 'PopupMoreMenu',

  components: {
    MoreIcon,
    SAnchoredMenu,
    SIconButton,
    SMenu,
    SMenuItem,
  },

  methods: {
    openFeedback,
    openHelp,
    openOptions,
  },
});
</script>

<style lang="scss" scoped>
.popup-more-menu {
  display: flex;
  flex: none;
  margin: -6px -8px -6px auto;
  color: var(--icon-color);
}

.popup-more-menu .more-list {
  max-height: none;
}
</style>
