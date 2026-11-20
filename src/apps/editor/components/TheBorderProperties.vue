<template>
  <div class="border-properties">
    <border-control />
    <radius />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import BorderControl from './layout/BorderControl.vue';
import Radius from './layout/Radius.vue';

export default Vue.extend({
  name: 'TheBorderProperties',

  components: {
    BorderControl,
    Radius,
  },
});
</script>
