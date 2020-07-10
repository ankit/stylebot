<template>
  <b-row class="style px-2 py-3" align-v="center">
    <style-editor
      v-if="edit"
      :initial-url="url"
      :initial-css="css"
      @save="
        // todo: handle syntax errors
        $emit('save', $event);
        edit = false;
      "
      @cancel="edit = false"
    />

    <b-col cols="10">
      <b-form-checkbox v-model="enabled" @change="$emit('toggle')">
        {{ url }}
      </b-form-checkbox>
    </b-col>

    <b-col cols="2">
      <b-row align-h="end">
        <style-edit-button class="mr-2" @click="edit = true" />
        <style-delete-button class="mr-2" :url="url" @click="$emit('delete')" />
      </b-row>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import StyleEditor from './StyleEditor.vue';
import StyleEditButton from './StyleEditButton.vue';
import StyleDeleteButton from './StyleDeleteButton.vue';

export default Vue.extend({
  name: 'Style',

  components: {
    StyleEditor,
    StyleEditButton,
    StyleDeleteButton,
  },
  props: ['url', 'css', 'initialEnabled'],

  data(): {
    enabled: boolean;
    edit: boolean;
  } {
    return {
      edit: false,
      enabled: this.initialEnabled,
    };
  },

  watch: {
    initialEnabled(newVal: boolean): void {
      this.enabled = newVal;
    },
  },
});
</script>

<style scoped>
.style:hover {
  outline: 1px solid #ddd;
}
</style>
