<template>
  <div @click="stopInspecting">
    <b-input-group>
      <the-css-selector-input :disabled="disabled" />

      <template #append>
        <dropdown-hack-to-support-shadow-dom>
          <b-dropdown
            right
            :disabled="disabled"
            variant="outline-secondary"
            class="css-selector-dropdown"
            @show="stopInspecting"
          >
            <the-css-selector-dropdown-item
              v-for="s in selectors"
              :key="s.id"
              :count="s.count"
              :selector="s.value"
            />
          </b-dropdown>
        </dropdown-hack-to-support-shadow-dom>
      </template>
    </b-input-group>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheCssSelectorInput from './TheCssSelectorInput.vue';
import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';
import DropdownHackToSupportShadowDom from './../DropdownHackToSupportShadowDom.vue';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  components: {
    TheCssSelectorInput,
    TheCssSelectorDropdownItem,
    DropdownHackToSupportShadowDom,
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
