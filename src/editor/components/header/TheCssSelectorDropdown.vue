<template>
  <s-autocomplete
    mono
    class="selector-autocomplete"
    :value="activeSelector"
    :items="filteredSelectors"
    :disabled="disabled"
    :min-width="300"
    :placeholder="t('pick_an_element')"
    @input="setSelector"
    @select="pickSelector"
    @click.native="stopInspecting"
  >
    <template v-if="filteredSelectors.length" #header>
      <div class="dropdown-header">
        <s-text size="caption" variant="muted" class="dropdown-header-label">{{ t('rules_on_this_page') }}</s-text>
        <s-text size="caption" variant="muted" class="dropdown-header-label">{{ t('declarations') }}</s-text>
      </div>
    </template>

    <template #item="{ item, select }">
      <the-css-selector-dropdown-item
        :selector="item.value"
        :style-count="item.styleCount"
        @select="select"
      />
    </template>
  </s-autocomplete>
</template>

<script lang="ts">
import Vue from 'vue';
import { SAutocomplete, SText } from '@stylebot/components';
import { StylebotEditingMode } from '@stylebot/types';

import { CssSelectorMetadata } from '../../store';
import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  components: {
    SAutocomplete,
    SText,
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

<style lang="scss" scoped>
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: -4px -4px 4px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--accent);
}

.dropdown-header-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
