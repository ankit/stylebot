<template>
  <v-btn
    tile
    elevation="0"
    :color="color"
    :ripple="false"
    :disabled="disabled"
    :outlined="outlined"
    :title="title"
    @click="$emit('click')"
  >
    {{ text }}
  </v-btn>
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
    outlined: {
      type: Boolean,
      required: false,
      default: true,
    },
    title: {
      type: String,
      required: false,
      default: '',
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
