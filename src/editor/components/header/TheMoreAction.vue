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
        Dock to Left
      </b-dropdown-item>

      <b-dropdown-item @click="dockToRight">
        <span style="height: 10px; width: 16px; display: inline-block;">
          <b-icon v-if="dockedRight" icon="check" font-scale="1.1" />
        </span>
        Dock to Right
      </b-dropdown-item>

      <b-dropdown-item @click="toggleSquishPage">
        <span style="height: 10px; width: 16px; display: inline-block;">
          <b-icon v-if="squishPage" icon="check" font-scale="1.1" />
        </span>
        Squish rest of the page
      </b-dropdown-item>
    </b-dropdown>
  </dropdown-hack-to-support-shadow-dom>
</template>

<script lang="ts">
import Vue from 'vue';

import { StylebotCoordinates } from '@stylebot/types';
import DropdownHackToSupportShadowDom from '../DropdownHackToSupportShadowDom.vue';

export default Vue.extend({
  name: 'TheMoreAction',

  components: {
    DropdownHackToSupportShadowDom,
  },

  computed: {
    coordinates(): StylebotCoordinates {
      return this.$store.state.options.coordinates;
    },

    dockedRight(): boolean {
      return this.coordinates.dockLocation === 'right';
    },

    squishPage(): boolean {
      return this.coordinates.squishPage;
    },
  },

  methods: {
    dockToRight(): void {
      this.$store.dispatch('setCoordinates', {
        ...this.coordinates,
        dockLocation: 'right',
      });
    },

    dockToLeft(): void {
      this.$store.dispatch('setCoordinates', {
        ...this.coordinates,
        dockLocation: 'left',
      });
    },

    toggleSquishPage(): void {
      this.$store.dispatch('setCoordinates', {
        ...this.coordinates,
        squishPage: !this.squishPage,
      });
    },
  },
});
</script>

<style lang="scss" scoped></style>
