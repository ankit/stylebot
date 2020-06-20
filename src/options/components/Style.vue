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
        <style-delete-button @click="$emit('delete')"></style-delete-button>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';

import StyleEditButton from './StyleEditButton.vue';
import StyleDeleteButton from './StyleDeleteButton.vue';

export default Vue.extend({
  name: 'Style',
  props: ['url', 'enabled'],
  components: {
    StyleEditButton,
    StyleDeleteButton,
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
