<template>
  <div class="layout-properties">
    <box-model />

    <border-control />

    <radius />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import BoxModel from './layout/BoxModel.vue';
import BorderControl from './layout/BorderControl.vue';
import Radius from './layout/Radius.vue';

export default Vue.extend({
  name: 'TheLayoutProperties',

  components: {
    BoxModel,
    BorderControl,
    Radius,
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
