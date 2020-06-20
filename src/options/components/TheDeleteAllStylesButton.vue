<template>
  <div>
    <app-button
      text="Delete all"
      color="red lighten-2"
      @click="dialog = true"
    />

    <v-dialog
      persistent
      max-width="500"
      v-model="dialog"
      transition="fade-transition"
    >
      <v-card>
        <v-card-title class="headline">Are you sure?</v-card-title>
        <v-card-text>This will permanently delete all your styles.</v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <app-button @click="dialog = false" text="No"></app-button>

          <app-button
            @click="
              dialog = false;
              $emit('click');
            "
            color="primary"
            text="Yes"
          ></app-button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import AppButton from './AppButton.vue';

export default {
  name: 'TheDeleteAllStylesButton',
  components: {
    AppButton,
  },
  data(): { dialog: boolean } {
    return {
      dialog: false,
    };
  },
};
</script>
