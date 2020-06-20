<template>
  <v-btn
    ripple="false"
    elevation="0"
    tile
    outlined
    :color="color"
    :disabled="disabled"
    @click="$emit('click')"
    >{{ text }}</v-btn
  >
</template>

<script lang="ts">
export default {
  name: 'AppButton',
  props: {
    text: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: false,
      default: 'grey darken-3',
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
};
</script>

<style scoped>
.v-btn {
  font-size: 16px;
  letter-spacing: 0;
  text-transform: none;
}
</style>
