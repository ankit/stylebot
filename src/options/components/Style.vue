<template>
  <v-row class="style" align="center" justify="end">
    <style-editor
      v-if="editDialog"
      :initialUrl="url"
      :initialCss="css"
      @save="
        editDialog = false;
        $emit('save', $event);
      "
      @cancel="editDialog = false"
    ></style-editor>

    <v-col cols="10">
      <v-checkbox
        :label="url"
        hide-details
        :ripple="false"
        :input-value="enabled"
        @click="enabled ? $emit('disable') : $emit('enable')"
      ></v-checkbox>
    </v-col>

    <v-col cols="2">
      <v-row align="center" justify="end">
        <style-edit-button
          class="style-edit"
          @click="editDialog = true"
        ></style-edit-button>

        <style-delete-button
          class="style-delete"
          @click="deleteConfirmationDialog = true"
        ></style-delete-button>

        <v-dialog
          v-model="deleteConfirmationDialog"
          max-width="500"
          persistent
          transition="none"
        >
          <v-card>
            <v-card-title class="headline">Are you sure?</v-card-title>
            <v-card-text
              >This will permanently delete your css for
              <strong>{{ url }}</strong
              >.</v-card-text
            >

            <v-card-actions>
              <v-spacer></v-spacer>
              <app-button
                @click="deleteConfirmationDialog = false"
                text="No"
              ></app-button>

              <app-button
                @click="
                  deleteConfirmationDialog = false;
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
import StyleEditor from './StyleEditor.vue';
import StyleEditButton from './StyleEditButton.vue';
import StyleDeleteButton from './StyleDeleteButton.vue';

export default Vue.extend({
  name: 'Style',
  props: ['url', 'css', 'enabled'],
  components: {
    AppButton,
    StyleEditor,
    StyleEditButton,
    StyleDeleteButton,
  },

  data(): {
    editDialog: boolean;
    deleteConfirmationDialog: boolean;
  } {
    return {
      editDialog: false,
      deleteConfirmationDialog: false,
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

.style-edit,
.style-delete {
  margin-right: 10px;
}
</style>
