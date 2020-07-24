<template>
  <div class="pb-5">
    <b-row class="section px-3 pt-3" no-gutters>
      <b-col cols="12" class="pb-1">
        <h1>Text and Colors</h1>
      </b-col>

      <b-col cols="12">
        <the-text-properties />
        <the-color-properties />
      </b-col>
    </b-row>

    <b-row class="section mt-4 px-3 pt-3" no-gutters>
      <b-col cols="12" class="pb-1">
        <h1>Visibility and Layout</h1>
      </b-col>

      <b-col cols="12">
        <the-layout-properties />
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheTextProperties from './TheTextProperties.vue';
import TheColorProperties from './TheColorProperties.vue';
import TheLayoutProperties from './TheLayoutProperties.vue';

export default Vue.extend({
  name: 'TheBasicEditor',

  components: {
    TheTextProperties,
    TheColorProperties,
    TheLayoutProperties,
  },
});
</script>

<style lang="scss">
.section {
  border-top: 1px solid #ddd;

  &:first-of-type {
    border: none;
    margin-top: 0;
  }
}
</style>
