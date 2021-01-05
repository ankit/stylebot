<template>
  <div
    class="stylebot-options-action"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <dropdown-hack-to-support-shadow-dom>
      <b-dropdown right class="stylebot-options-dropdown">
        <the-delete-style-dropdown-item
          @click="
            deleteStyleDialog = true;
            isHovered = false;
          "
        />

        <b-dropdown-item-button @click="viewOptions">
          {{ t('view_options') }}
        </b-dropdown-item-button>

        <b-dropdown-item-button @click="showHelp">
          {{ t('view_keyboard_shortcuts') }}
        </b-dropdown-item-button>

        <template #button-content>
          <b-icon v-if="!isHovered" icon="gear" />
          <b-icon v-if="isHovered" icon="gear-fill" />
        </template>
      </b-dropdown>
    </dropdown-hack-to-support-shadow-dom>

    <the-delete-style-dialog
      v-if="deleteStyleDialog"
      @close="deleteStyleDialog = false"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheDeleteStyleDialog from './TheDeleteStyleDialog.vue';
import TheDeleteStyleDropdownItem from './TheDeleteStyleDropdownItem.vue';
import DropdownHackToSupportShadowDom from './../DropdownHackToSupportShadowDom.vue';

import { openOptionsPage } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheOptionsAction',

  components: {
    TheDeleteStyleDialog,
    TheDeleteStyleDropdownItem,
    DropdownHackToSupportShadowDom,
  },

  data(): { isHovered: boolean; deleteStyleDialog: boolean } {
    return {
      isHovered: false,
      deleteStyleDialog: false,
    };
  },

  methods: {
    viewOptions(): void {
      openOptionsPage();
    },

    showHelp(): void {
      this.$store.commit('setHelp', true);
    },
  },
});
</script>

<style lang="scss">
.stylebot-options-action {
  display: inline-block;
}

.stylebot-options-dropdown {
  vertical-align: top !important;

  .dropdown-toggle {
    background: none !important;
    color: #000 !important;
    border: none !important;
    font-size: 15.5px !important;
    padding: 0 !important;
    line-height: 20px !important;

    .b-icon.bi {
      display: inline-block !important;
      overflow: visible !important;
      vertical-align: -0.15em !important;
    }

    &::after {
      display: none !important;
    }

    svg {
      font-size: 100% !important;
    }

    &:focus {
      box-shadow: none !important;
      outline: -webkit-focus-ring-color auto 5px !important;
    }
  }
}
</style>
