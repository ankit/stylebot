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

      <b-dropdown-item @click="toggleSquishPage">
        <span style="height: 10px; width: 16px; display: inline-block;">
          <b-icon v-if="squishPage" icon="check" font-scale="1.1" />
        </span>

        {{ t('squish_page') }}
      </b-dropdown-item>
    </b-dropdown>
  </dropdown-hack-to-support-shadow-dom>
</template>

<script lang="ts">
import Vue from 'vue';

import { StylebotLayout } from '@stylebot/types';
import DropdownHackToSupportShadowDom from '../DropdownHackToSupportShadowDom.vue';

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

    squishPage(): boolean {
      return this.layout.squishPage;
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

    toggleSquishPage(): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        squishPage: !this.squishPage,
      });
    },
  },
});
</script>

<style lang="scss" scoped></style>
