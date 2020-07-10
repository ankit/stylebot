<template>
  <div>
    <b-row class="section" no-gutters>
      <b-col cols="12">
        <h1>Text</h1>
      </b-col>
      <b-col cols="12">
        <the-text-properties />
      </b-col>
    </b-row>

    <b-row class="section" no-gutters>
      <b-col cols="12">
        <h1>Colors and Background</h1>
      </b-col>
      <b-col cols="12">
        <the-color-properties />
      </b-col>
    </b-row>

    <b-row class="section" no-gutters>
      <b-col cols="12">
        <h1>Layout and Visibility</h1>
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
  margin-top: 30px;
  padding: 15px 10px 0 10px;
  border-top: 1px solid #ddd;

  &:first-of-type {
    border: none;
    margin-top: 0;
  }
}
</style>
