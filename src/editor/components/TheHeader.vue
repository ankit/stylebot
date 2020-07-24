<template>
  <b-row class="header justify-content-md-between" no-gutters>
    <b-col cols="2" class="p-0">
      <the-inspector @select="inspect($event)" />
    </b-col>

    <b-col cols="8" align-self="center" class="pl-2 pr-3">
      <the-css-selector-dropdown />

      <div class="url">{{ url }}</div>
    </b-col>

    <b-col cols="2">
      <the-window-actions />
    </b-col>
  </b-row>
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
  padding: 10px;
  background: #eee;
}

.url {
  color: #333;
  font-size: 13px;
  padding: 0 8px;
  margin-top: 7px;
}
</style>
