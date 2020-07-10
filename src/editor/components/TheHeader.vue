<template>
  <b-row class="header justify-content-md-between" no-gutters>
    <b-col cols="2" class="p-0" style="margin: auto">
      <the-inspector @select="inspect($event)" />
    </b-col>

    <b-col cols="8" align-self="center" class="pl-2 pr-3">
      <the-css-selector-dropdown />
      <the-url-input />
    </b-col>

    <b-col cols="2">
      <b-row class="justify-content-md-end">
        <the-header-actions />
      </b-row>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import TheUrlInput from './header/TheUrlInput.vue';
import TheInspector from './header/TheInspector.vue';
import TheHeaderActions from './header/TheHeaderActions.vue';
import TheCssSelectorDropdown from './header/TheCssSelectorDropdown.vue';

export default Vue.extend({
  name: 'TheHeader',

  components: {
    TheUrlInput,
    TheInspector,
    TheHeaderActions,
    TheCssSelectorDropdown,
  },

  data(): {
    selector: string | null;
  } {
    return {
      selector: null,
    };
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
</style>
