<template>
  <s-autocomplete
    mono
    class="selector-autocomplete"
    :value="activeSelector"
    :items="filteredSelectors"
    :disabled="disabled"
    :min-width="300"
    :placeholder="t('enter_css_selector')"
    @input="setSelector"
    @select="pickSelector"
    @click.native="stopInspecting"
  >
    <template #item="{ item, select }">
      <the-css-selector-dropdown-item
        :selector="item.value"
        :count="item.count"
        @select="select"
      />
    </template>
  </s-autocomplete>
</template>

<script lang="ts">
import Vue from 'vue';
import { SAutocomplete } from '@stylebot/components';
import { StylebotEditingMode } from '@stylebot/types';

import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';

type CssSelectorMetadata = { id: number; value: string; count: number };

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  components: {
    SAutocomplete,
    TheCssSelectorDropdownItem,
  },

  computed: {
    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },

    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    selectors(): Array<CssSelectorMetadata> {
      return this.$store.state.selectors;
    },

    filteredSelectors(): Array<CssSelectorMetadata> {
      const query = this.activeSelector.trim().toLowerCase();
      if (!query) {
        return this.selectors;
      }

      return this.selectors.filter(s => {
        const value = s.value.toLowerCase();
        return value.includes(query) && value !== query;
      });
    },

    disabled(): boolean {
      return this.mode !== 'basic';
    },
  },

  methods: {
    setSelector(value: string): void {
      this.$store.commit('setActiveSelector', value);
    },

    pickSelector(item: CssSelectorMetadata): void {
      this.$store.commit('setActiveSelector', item.value);
    },

    stopInspecting(): void {
      this.$store.commit('setInspecting', false);
    },
  },
});
</script>
