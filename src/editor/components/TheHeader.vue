<template>
  <div class="header">
    <the-inspector @select="inspect($event)" />

    <div class="header-selector">
      <the-css-selector-dropdown />
      <div class="url">{{ url }}</div>
    </div>

    <the-window-actions />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheInspector from './header/TheInspector.vue';
import TheWindowActions from './header/TheWindowActions.vue';
import TheCssSelectorDropdown from './header/TheCssSelectorDropdown.vue';

export default Vue.extend({
  name: 'TheHeader',

  components: {
    TheInspector,
    TheWindowActions,
    TheCssSelectorDropdown,
  },

  data(): {
    selector: string | null;
  } {
    return {
      selector: null,
    };
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
  align-items: center;
  padding-right: 8px;
  background: var(--accent);
  border-bottom: 1px solid var(--border);
}

.header-selector {
  flex: 1;
  min-width: 0;
  padding: 0 8px;
}

.url {
  color: var(--muted-foreground);
  font-size: 12px;
  padding: 0 8px;
  margin-top: 3px;
}
</style>
