<template>
  <div class="header">
    <div class="header-top">
      <div class="style-identity">
        <s-text class="url">{{ url }}</s-text>
        <the-profile-switcher />
      </div>
      <the-window-actions />
    </div>

    <div class="selector-row" @keydown.esc="onSelectorRowEscape">
      <the-inspector ref="inspector" @select="inspect($event)" />
      <the-css-selector-dropdown />
    </div>

    <the-editor-mode-actions ref="modeActions" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SText } from '@stylebot/components';

import TheInspector from './header/TheInspector.vue';
import TheWindowActions from './header/TheWindowActions.vue';
import TheProfileSwitcher from './header/TheProfileSwitcher.vue';
import TheCssSelectorDropdown from './header/TheCssSelectorDropdown.vue';
import TheEditorModeActions from './header/TheEditorModeActions.vue';
import { consumeFieldEscape } from '@stylebot/utils';

type InspectorRef = { focus(): void };
type ModeActionsRef = { focusModeTab(): void };

export default Vue.extend({
  name: 'TheHeader',

  components: {
    SText,
    TheInspector,
    TheWindowActions,
    TheProfileSwitcher,
    TheCssSelectorDropdown,
    TheEditorModeActions,
  },

  computed: {
    url(): string {
      return this.$store.state.url;
    },
  },

  methods: {
    inspect(selector: string): void {
      this.$store.commit('setActiveSelector', selector);
      this.$store.dispatch('loadSelectorAlternatives', selector);
    },

    onSelectorRowEscape(event: KeyboardEvent): void {
      if (consumeFieldEscape(event)) {
        (this.$refs.inspector as unknown as InspectorRef).focus();
      }
    },

    focusModeTab(): void {
      (this.$refs.modeActions as unknown as ModeActionsRef).focusModeTab();
    },
  },
});
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  flex-direction: column;
  background: var(--panel-surface);
  border-bottom: 1px solid var(--panel-border);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 13px 4px 16px;
}

.style-identity {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.url {
  @include truncate;

  flex: 0 1 auto;
  max-width: 150px;
  min-width: 0;
}

.selector-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
}
</style>
