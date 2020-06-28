<template>
  <b-row class="stylebot-header justify-content-md-between">
    <b-col cols="2" style="padding: 0">
      <the-inspector @select="selector = $event" />
    </b-col>

    <b-col cols="7" align-self="center">
      <the-css-selector-dropdown :selector="selector" />
    </b-col>

    <b-col cols="3">
      <b-row class="justify-content-md-end">
        <the-header-actions />
      </b-row>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import TheInspector from './TheInspector.vue';
import TheHeaderActions from './TheHeaderActions.vue';
import TheCssSelectorDropdown from './TheCssSelectorDropdown.vue';

export default Vue.extend({
  name: 'TheHeader',
  components: {
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
});
</script>

<style scoped>
.stylebot-header {
  padding: 10px;
  background: #eee;
}
</style>
