<template>
  <v-btn
    color="error"
    :ripple="false"
    elevation="0"
    fab
    x-small
    @click="$emit('click')"
  >
    <v-icon>mdi-delete</v-icon>
  </v-btn>
</template>

<script lang="ts">
export default {
  name: 'StyleDeleteButton',
};
</script>
