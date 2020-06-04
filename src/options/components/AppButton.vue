<template>
  <v-btn :ripple="false" elevation="0" tile outlined v-bind:color="color">{{
    text
  }}</v-btn>
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
  },
};
</script>

<style scoped>
.v-btn {
  text-transform: none;
}
</style>
