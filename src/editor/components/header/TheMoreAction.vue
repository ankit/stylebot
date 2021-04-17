<template>
  <dropdown-hack-to-support-shadow-dom>
    <b-dropdown
      right
      no-caret
      size="sm"
      variant="button"
      toggle-class="text-decoration-none"
    >
      <template #button-content>
        <b-icon icon="three-dots" />
      </template>

      <b-dropdown-item @click="dockToLeft">
        <span style="height: 10px; width: 16px; display: inline-block;">
          <b-icon v-if="!dockedRight" icon="check" font-scale="1.1" />
        </span>

        {{ t('dock_to_left') }}
      </b-dropdown-item>

      <b-dropdown-item @click="dockToRight">
        <span style="height: 10px; width: 16px; display: inline-block;">
          <b-icon v-if="dockedRight" icon="check" font-scale="1.1" />
        </span>

        {{ t('dock_to_right') }}
      </b-dropdown-item>

      <b-dropdown-item @click="toggleAdjustPageLayout">
        <span style="height: 10px; width: 16px; display: inline-block;">
          <b-icon v-if="adjustPageLayout" icon="check" font-scale="1.1" />
        </span>

        {{ t('adjust_page_layout') }}
      </b-dropdown-item>

      <b-dropdown-divider />

      <b-dropdown-item @click="keyboardShortcuts">
        <span style="height: 10px; width: 16px; display: inline-block;" />

        {{ t('view_keyboard_shortcuts') }}
      </b-dropdown-item>

      <b-dropdown-item @click="optionsPage">
        <span style="height: 10px; width: 16px; display: inline-block;" />

        {{ t('view_options') }}
      </b-dropdown-item>

      <b-dropdown-divider />

      <b-dropdown-item @click="donate">
        <span style="height: 10px; width: 16px; display: inline-block;" />

        {{ t('donate') }}
      </b-dropdown-item>
    </b-dropdown>
  </dropdown-hack-to-support-shadow-dom>
</template>

<script lang="ts">
import Vue from 'vue';

import { StylebotLayout } from '@stylebot/types';
import DropdownHackToSupportShadowDom from '../DropdownHackToSupportShadowDom.vue';

import { openOptionsPage, openDonatePage } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheMoreAction',

  components: {
    DropdownHackToSupportShadowDom,
  },

  computed: {
    layout(): StylebotLayout {
      return this.$store.state.options.layout;
    },

    dockedRight(): boolean {
      return this.layout.dockLocation === 'right';
    },

    adjustPageLayout(): boolean {
      return this.layout.adjustPageLayout;
    },
  },

  methods: {
    dockToRight(): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        dockLocation: 'right',
      });
    },

    dockToLeft(): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        dockLocation: 'left',
      });
    },

    toggleAdjustPageLayout(): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        adjustPageLayout: !this.adjustPageLayout,
      });
    },

    keyboardShortcuts(): void {
      this.$store.commit('setHelp', true);
    },

    optionsPage(): void {
      openOptionsPage();
    },

    donate(): void {
      openDonatePage();
    },
  },
});
</script>

<style lang="scss" scoped></style>
