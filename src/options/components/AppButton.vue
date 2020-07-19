<template>
  <b-btn
    class="app-btn"
    :size="size"
    :title="title"
    :variant="variant"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </b-btn>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'AppButton',
  props: {
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
    size: {
      type: String,
      required: false,
      default: 'large',
    },
  },
});
</script>

<style lang="scss" scoped>
.app-btn {
  border-radius: 2px;
}
</style>
