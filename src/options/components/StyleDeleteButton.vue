<template>
  <div>
    <v-btn
      color="error"
      :ripple="false"
      elevation="0"
      fab
      x-small
      @click="dialog = true"
      title="Delete Style"
    >
      <v-icon>mdi-delete</v-icon>
    </v-btn>

    <v-dialog
      persistent
      max-width="500"
      transition="fade-transition"
      v-model="dialog"
    >
      <v-card>
        <v-card-title class="headline-2">
          Delete style for {{ url }}
        </v-card-title>

        <v-card-text class="pb-0">
          <v-alert text type="warning">
            This will permanently delete your style. You can't undo this.
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
            text="Delete"
            :outlined="false"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import AppButton from './AppButton.vue';

export default {
  name: 'StyleDeleteButton',
  props: ['url'],
  components: {
    AppButton,
  },

  data(): {
    dialog: boolean;
  } {
    return {
      dialog: false,
    };
  },
};
</script>
