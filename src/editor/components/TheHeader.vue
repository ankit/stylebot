<template>
  <div class="header">
    <div class="header-top">
      <div class="url">{{ url }}</div>
      <the-window-actions />
    </div>

    <div class="selector-row">
      <the-inspector @select="inspect($event)" />
      <the-css-selector-dropdown />
    </div>

    <the-editor-mode-actions />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheInspector from './header/TheInspector.vue';
import TheWindowActions from './header/TheWindowActions.vue';
import TheCssSelectorDropdown from './header/TheCssSelectorDropdown.vue';
import TheEditorModeActions from './header/TheEditorModeActions.vue';

export default Vue.extend({
  name: 'TheHeader',

  components: {
    TheInspector,
    TheWindowActions,
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
    },
  },
});
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  flex-direction: column;
  background: var(--background);
  border-bottom: 1px solid var(--border);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px 7px 14px;
  border-bottom: 1px solid var(--border);
}

.url {
  flex: none;
  max-width: 150px;
  font-size: 11.5px;
  color: var(--muted-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
}
</style>
