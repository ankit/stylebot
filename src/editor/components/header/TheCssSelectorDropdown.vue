<template>
  <div @click="stopInspecting">
    <b-input-group>
      <the-css-selector-input :disabled="disabled" />

      <template v-slot:append>
        <dropdown-hack-to-support-shadow-dom>
          <b-dropdown
            right
            :disabled="disabled"
            @show="stopInspecting"
            variant="outline-secondary"
            class="css-selector-dropdown"
          >
            <the-delete-css-dropdown-item
              @click="deleteCssDialog = true"
              :disabled="selectors.length === 0"
            />

            <b-dropdown-divider v-if="selectors.length > 0" />

            <the-css-selector-dropdown-item
              :key="selectorMetadata.value"
              :count="selectorMetadata.count"
              :selector="selectorMetadata.value"
              v-for="selectorMetadata in selectors"
            />
          </b-dropdown>
        </dropdown-hack-to-support-shadow-dom>
      </template>
    </b-input-group>

    <the-delete-css-dialog
      v-if="deleteCssDialog"
      @close="deleteCssDialog = false"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheDeleteCssDialog from './TheDeleteCssDialog.vue';
import TheCssSelectorInput from './TheCssSelectorInput.vue';
import TheDeleteCssDropdownItem from './TheDeleteCssDropdownItem.vue';
import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';
import DropdownHackToSupportShadowDom from './../DropdownHackToSupportShadowDom.vue';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  components: {
    TheDeleteCssDialog,
    TheCssSelectorInput,
    TheDeleteCssDropdownItem,
    TheCssSelectorDropdownItem,
    DropdownHackToSupportShadowDom,
  },

  data(): {
    deleteCssDialog: boolean;
  } {
    return {
      deleteCssDialog: false,
    };
  },

  computed: {
    selectors(): Array<{ value: string; count: number }> {
      return this.$store.state.selectors;
    },

    disabled(): boolean {
      return this.$store.state.options.mode !== 'basic';
    },
  },

  methods: {
    stopInspecting(): void {
      this.$store.commit('setInspecting', false);
    },
  },
});
</script>

<style lang="scss">
.css-selector-dropdown {
  .dropdown-toggle {
    height: 30px !important;
    padding: 0 8px !important;
    padding-top: 3px !important;
  }

  .dropdown-menu {
    border: none !important;
    min-width: 120px !important;
    margin-left: 1px !important;
  }
}
</style>
