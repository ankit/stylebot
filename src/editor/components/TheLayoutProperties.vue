<template>
  <div class="layout-properties">
    <visibility />

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
      last
      :properties="{
        top: 'margin-top',
        right: 'margin-right',
        bottom: 'margin-bottom',
        left: 'margin-left',
      }"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import SpacingControl from './layout/SpacingControl.vue';
import Visibility from './layout/Visibility.vue';

export default Vue.extend({
  name: 'TheLayoutProperties',

  components: {
    SpacingControl,
    Visibility,
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
