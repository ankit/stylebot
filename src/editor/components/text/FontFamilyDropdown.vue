<template>
  <div>
    <dropdown-hack-to-support-shadow-dom>
      <b-dropdown
        right
        size="sm"
        :text="text"
        :disabled="disabled"
        variant="outline-secondary"
        class="font-family-dropdown"
      >
        <b-dropdown-item v-if="!hideDefault" @click="$emit('select', '')">
          {{ t('default') }}
        </b-dropdown-item>

        <b-dropdown-item
          v-for="font in fonts"
          :key="font"
          @click="$emit('select', font)"
        >
          {{ font }}
        </b-dropdown-item>

        <b-dropdown-item @click="editFonts">
          {{ t('fonts_edit_list') }}
        </b-dropdown-item>
      </b-dropdown>
    </dropdown-hack-to-support-shadow-dom>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { t } from '@stylebot/i18n';

import { openOptionsPage } from '../../utils/chrome';

import DropdownHackToSupportShadowDom from './../DropdownHackToSupportShadowDom.vue';

export default Vue.extend({
  name: 'FontFamilyDropdown',

  components: {
    DropdownHackToSupportShadowDom,
  },

  props: {
    disabled: {
      type: Boolean,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    fonts: {
      type: Array,
      required: true,
    },
    hideDefault: {
      type: Boolean,
      required: false,
    },
  },

  computed: {
    text: {
      get(): string {
        if (!this.value) {
          return t('default');
        }

        return this.value;
      },
    },
  },

  methods: {
    editFonts() {
      openOptionsPage();
    },
  },
});
</script>

<style lang="scss">
.font-family-dropdown {
  .dropdown-toggle {
    border-top-left-radius: 3.2px !important;
    border-bottom-left-radius: 3.2px !important;
  }
}
</style>
