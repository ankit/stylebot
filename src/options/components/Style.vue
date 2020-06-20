<template>
  <v-row class="style" align="center" justify="end">
    <v-col cols="10">
      <v-checkbox
        :label="url"
        :value="enabled"
        :ripple="false"
        hide-details
      ></v-checkbox>
    </v-col>

    <v-col cols="2">
      <v-row align="center" justify="end">
        <style-edit-button
          class="style-edit"
          @click="$emit('edit')"
        ></style-edit-button>

        <style-delete-button @click="dialog = true"></style-delete-button>

        <v-dialog v-model="dialog" max-width="500" persistent transition="none">
          <v-card>
            <v-card-title class="headline">Are you sure?</v-card-title>
            <v-card-text
              >This will permanently delete your css for
              <strong>{{ url }}</strong
              >.</v-card-text
            >
            <v-card-actions>
              <v-spacer></v-spacer>
              <app-button @click="dialog = false" text="No"></app-button>
              <app-button
                @click="
                  dialog = false;
                  $emit('delete');
                "
                color="primary"
                text="Yes"
              ></app-button>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';

import AppButton from './AppButton.vue';
import StyleEditButton from './StyleEditButton.vue';
import StyleDeleteButton from './StyleDeleteButton.vue';

export default Vue.extend({
  name: 'Style',
  props: ['url', 'enabled'],
  components: {
    AppButton,
    StyleEditButton,
    StyleDeleteButton,
  },
  data(): {
    dialog: boolean;
  } {
    return {
      dialog: false,
    };
  },
});
</script>

<style scoped>
.style:hover {
  background-color: #eee;
}

.style .v-input {
  margin: 0;
  padding: 0;
}

.style-edit {
  margin-right: 10px;
}
</style>
