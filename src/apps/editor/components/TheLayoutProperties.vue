<template>
  <div class="layout-properties">
    <box-model />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import BoxModel from './layout/BoxModel.vue';

export default Vue.extend({
  name: 'TheLayoutProperties',

  components: {
    BoxModel,
  },
});
</script>

<style lang="scss" scoped>
.layout-properties {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
