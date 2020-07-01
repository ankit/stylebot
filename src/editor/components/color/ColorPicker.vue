<template>
  <div>
    <button class="stylebot-color-picker-btn" @click="enabled = !enabled">
      <div class="stylebot-color-picker-color" :style="{ background: color }" />
    </button>

    <chrome-picker
      v-if="enabled"
      :value="color"
      class="stylebot-color-picker"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Chrome } from 'vue-color';

export default Vue.extend({
  name: 'ColorPicker',

  props: ['color'],

  components: {
    'chrome-picker': Chrome,
  },

  data(): {
    enabled: boolean;
  } {
    return {
      enabled: false,
    };
  },
});
</script>

<style scoped>
.stylebot-color-picker-btn {
  width: 45px;
  height: 25px;
  padding: 3px;
  background: #eee;
  border: 1px solid #ccc;
}

.stylebot-color-picker-color {
  height: 15px;
  border: 1px solid #888;
}

.stylebot-color-picker {
  top: 28px;
  z-index: 1;
  right: -8px;
  position: absolute;
}
</style>
