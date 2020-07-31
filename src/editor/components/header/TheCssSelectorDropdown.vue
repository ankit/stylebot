<template>
  <div @click="stopInspecting">
    <b-input-group class="css-selector-input-group">
      <the-css-selector-input :disabled="disabled" />

      <template #append>
        <dropdown-hack-to-support-shadow-dom>
          <b-dropdown
            right
            size="sm"
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
.css-selector-input-group {
  .dropdown-toggle {
    line-height: 21px !important;
  }
}
</style>
