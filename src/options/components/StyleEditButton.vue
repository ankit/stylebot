<template>
  <v-btn
    color="primary"
    :ripple="false"
    elevation="0"
    fab
    x-small
    title="Edit Style"
    @click="$emit('click')"
  >
    <v-icon>mdi-pencil</v-icon>
  </v-btn>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'StyleEditButton',
});
</script>
