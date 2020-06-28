<template>
  <b-row class="stylebot-header justify-content-md-between">
    <b-col cols="2" style="padding: 0">
      <the-inspector @select="selector = $event" />
    </b-col>

    <b-col cols="7" align-self="center">
      <b-dropdown
        class="stylebot-selector-dropdown"
        v-if="selector"
        size="sm"
        :text="selector"
        variant="outline-primary"
      ></b-dropdown>

      <b-dropdown
        v-if="!selector"
        size="sm"
        text="Select an element"
        variant="outline-primary"
        class="stylebot-selector-dropdown"
      ></b-dropdown>
    </b-col>

    <b-col cols="3">
      <b-row class="justify-content-md-end">
        <b-icon class="stylebot-window-action" icon="gear" />
        <b-icon class="stylebot-window-action" icon="x-circle" />
      </b-row>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import TheInspector from './TheInspector.vue';

export default Vue.extend({
  name: 'TheHeader',
  components: {
    TheInspector,
  },
  data(): {
    selector?: string;
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

.stylebot-window-action {
  margin-left: 5px;
}
</style>
