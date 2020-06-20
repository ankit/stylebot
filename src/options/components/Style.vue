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
          :url="url"
          class="style-delete"
          @click="$emit('delete')"
        ></style-delete-button>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';

import StyleEditor from './StyleEditor.vue';
import StyleEditButton from './StyleEditButton.vue';
import StyleDeleteButton from './StyleDeleteButton.vue';

export default Vue.extend({
  name: 'Style',
  props: ['url', 'css', 'enabled'],
  components: {
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
