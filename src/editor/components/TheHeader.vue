<template>
  <b-row class="header pl-3 pr-2 py-2 justify-content-md-between" no-gutters>
    <b-col cols="2" class="p-0">
      <the-inspector @select="inspect($event)" />
    </b-col>

    <b-col cols="7" align-self="center" class="px-2">
      <the-css-selector-dropdown />
      <div class="url">{{ url }}</div>
    </b-col>

    <b-col cols="3">
      <the-window-actions />
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import TheInspector from './header/TheInspector.vue';
import TheWindowActions from './header/TheWindowActions.vue';
import TheCssSelectorDropdown from './header/TheCssSelectorDropdown.vue';

import { StylebotEditingMode } from '@stylebot/types';

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

    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },
  },

  methods: {
    inspect(selector: string): void {
      if (this.mode === 'chat') {
        this.$store.commit('setChatSelectedElement', selector);
        return;
      }

      this.$store.commit('setActiveSelector', selector);
    },
  },
});
</script>

<style lang="scss" scoped>
.header {
  background: #eee;
}

.url {
  color: #333;
  font-size: 12px;
  padding: 0 8px;
  margin-top: 3px;
}
</style>
