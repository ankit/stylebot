<template>
  <b-row class="stylebot-header justify-content-md-between">
    <b-col cols="3" style="padding: 0"><the-inspector /></b-col>

    <b-col cols="4">
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
