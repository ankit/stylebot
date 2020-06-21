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
        <v-card-title class="headline-2">Delete All Styles</v-card-title>
        <v-card-text class="pb-0">
          <v-alert text type="warning">
            This will permanently delete all your styles. You can't undo this.
          </v-alert>
        </v-card-text>

        <v-card-actions class="pt-4 pb-6 px-6">
          <v-spacer />

          <app-button @click="dialog = false" text="Cancel" />

          <app-button
            @click="
              dialog = false;
              $emit('click');
            "
            color="primary"
            :outlined="false"
            text="Delete All Styles"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import AppButton from './AppButton.vue';

export default Vue.extend({
  name: 'TheDeleteAllStylesButton',
  components: {
    AppButton,
  },

  data(): { dialog: boolean } {
    return {
      dialog: false,
    };
  },
});
</script>
