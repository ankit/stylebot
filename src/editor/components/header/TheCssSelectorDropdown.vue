<template>
  <anchored-menu class="selector-anchor" @click.native="stopInspecting">
    <template #trigger="{ toggle, open }">
      <div class="selector-pill" :class="{ disabled }">
        <the-css-selector-input :disabled="disabled" />

        <button
          v-if="activeCount !== null"
          type="button"
          class="selector-count"
          :disabled="disabled"
          @click="toggle"
        >
          {{ activeCount }}
        </button>

        <button type="button" class="selector-chevron" :class="{ open }" :disabled="disabled" @click="toggle">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 4.5 6 7.5 9 4.5" />
          </svg>
        </button>
      </div>
    </template>

    <template #default="{ close }">
      <s-menu>
        <the-css-selector-dropdown-item
          v-for="s in selectors"
          :key="s.id"
          :count="s.count"
          :selector="s.value"
          @select="close"
        />
      </s-menu>
    </template>
  </anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { AnchoredMenu, SMenu } from '@stylebot/components';
import { validateSelector } from '@stylebot/css';
import { StylebotEditingMode } from '@stylebot/types';

import TheCssSelectorInput from './TheCssSelectorInput.vue';
import TheCssSelectorDropdownItem from './TheCssSelectorDropdownItem.vue';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  components: {
    AnchoredMenu,
    SMenu,
    TheCssSelectorInput,
    TheCssSelectorDropdownItem,
  },

  computed: {
    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },

    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    selectors(): Array<{ value: string; count: number }> {
      return this.$store.state.selectors;
    },

    disabled(): boolean {
      return this.mode !== 'basic';
    },

    activeCount(): number | null {
      if (!this.activeSelector || !validateSelector(this.activeSelector)) {
        return null;
      }

      try {
        return document.querySelectorAll(this.activeSelector).length;
      } catch {
        return null;
      }
    },
  },

  methods: {
    stopInspecting(): void {
      this.$store.commit('setInspecting', false);
    },
  },
});
</script>

<style lang="scss" scoped>
.selector-anchor {
  flex: 1;
  min-width: 0;
}

.selector-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid var(--input);
  border-radius: 9px;
  background: var(--background);

  &.disabled {
    opacity: 0.6;
  }
}

.selector-count {
  all: unset;
  flex: none;
  font-family: Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: var(--muted-foreground);
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--foreground);
  }

  &:disabled {
    cursor: default;
  }
}

.selector-chevron {
  all: unset;
  flex: none;
  display: inline-flex;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: transform 0.15s ease;

  &.open {
    transform: rotate(180deg);
  }

  &:disabled {
    cursor: default;
  }
}
</style>
