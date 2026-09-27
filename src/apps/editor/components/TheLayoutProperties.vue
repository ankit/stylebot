<template>
  <div class="layout-properties">
    <spacing-control
      :label="t('padding')"
      :properties="{
        top: 'padding-top',
        right: 'padding-right',
        bottom: 'padding-bottom',
        left: 'padding-left',
      }"
    />

    <spacing-control
      :label="t('margin')"
      :properties="{
        top: 'margin-top',
        right: 'margin-right',
        bottom: 'margin-bottom',
        left: 'margin-left',
      }"
    />

    <border-control />

    <radius />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import SpacingControl from './layout/SpacingControl.vue';
import BorderControl from './layout/BorderControl.vue';
import Radius from './layout/Radius.vue';

export default Vue.extend({
  name: 'TheLayoutProperties',

  components: {
    SpacingControl,
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
