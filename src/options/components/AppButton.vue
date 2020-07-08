<template>
  <b-btn
    class="app-btn"
    :title="title"
    :variant="variant"
    :disabled="disabled"
    @click="$emit('click')"
  >
    {{ text }}
  </b-btn>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'AppButton',
  props: {
    text: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    title: {
      type: String,
      required: false,
      default: '',
    },
    variant: {
      type: String,
      required: false,
      default: 'secondary',
    },
  },
});
</script>

<style lang="scss" scoped>
.app-btn {
  border-radius: 2px;
}
</style>
