<template>
  <v-row class="style" align="center" justify="end">
    <style-editor
      v-if="editDialog"
      :initialUrl="url"
      :initialCss="css"
      @save="
        const response = $emit('save', $event);
        // todo: display error stacktrace
        if (response.success) {
          editDialog = false;
        }
      "
      @cancel="editDialog = false"
    />

    <v-col cols="10">
      <v-checkbox
        hide-details
        :label="url"
        :ripple="false"
        v-model="enabled"
        @click="$emit('toggle')"
      />
    </v-col>

    <v-col cols="2">
      <v-row align="center" justify="end">
        <style-edit-button class="mr-2" @click="editDialog = true" />
        <style-delete-button :url="url" class="mr-2" @click="$emit('delete')" />
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
  props: ['url', 'css', 'initialEnabled'],

  watch: {
    initialEnabled(newVal: boolean): void {
      this.enabled = newVal;
    },
  },

  components: {
    StyleEditor,
    StyleEditButton,
    StyleDeleteButton,
  },

  data(): {
    enabled: boolean;
    editDialog: boolean;
  } {
    return {
      editDialog: false,
      enabled: this.initialEnabled,
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
</style>
