<template>
  <v-row no-gutters>
    <v-col cols="6">
      <v-row>
        <v-col>
          <h2 class="title">Styles</h2>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-text-field placeholder="Search..."></v-text-field>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="10">
          <app-button color="primary" text="Add a new style..." />
          <app-button text="Enable all" />
          <app-button text="Disable all" />
        </v-col>

        <v-col cols="2">
          <app-button text="Delete all" color="red lighten-2" />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import AppButton from './AppButton.vue';

export default {
  name: 'TheStylesTab',
  components: {
    AppButton,
  },
};
</script>
