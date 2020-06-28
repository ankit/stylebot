<template>
  <div>
    <b-icon class="stylebot-header-action" icon="gear" />
    <b-icon class="stylebot-header-action" icon="x-circle" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheHeaderActions',
});
</script>

<style scoped>
.stylebot-header-action {
  margin-left: 5px;
}
</style>
