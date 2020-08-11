<template>
  <div>
    <border-style />
    <border-color class="mt-3" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import BorderStyle from './border/BorderStyle.vue';
import BorderColor from './border/BorderColor.vue';

export default Vue.extend({
  name: 'TheBorderProperties',

  components: {
    BorderStyle,
    BorderColor,
  },
});
</script>
