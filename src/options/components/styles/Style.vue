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

    <b-col cols="9">
      <b-form-checkbox v-model="enabled" @change="$emit('toggle')">
        {{ url }}
      </b-form-checkbox>
    </b-col>

    <b-col cols="3">
      <b-row align-h="end">
        <app-button
          class="mr-2"
          size="sm"
          variant="outline-primary"
          @click="edit = true"
        >
          Edit...
        </app-button>

        <style-delete-button class="mr-2" :url="url" @click="$emit('delete')" />
      </b-row>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import AppButton from '../AppButton.vue';
import StyleEditor from './StyleEditor.vue';
import StyleDeleteButton from './StyleDeleteButton.vue';

export default Vue.extend({
  name: 'Style',

  components: {
    AppButton,
    StyleEditor,
    StyleDeleteButton,
  },

  props: ['url', 'css', 'initialEnabled', 'initialReadability'],

  data(): {
    enabled: boolean;
    edit: boolean;
    readability: boolean;
  } {
    return {
      edit: false,
      enabled: this.initialEnabled,
      readability: this.initialReadability,
    };
  },

  watch: {
    initialEnabled(newVal: boolean): void {
      this.enabled = newVal;
    },

    initialReadability(newVal: boolean): void {
      this.readability = newVal;
    },
  },
});
</script>

<style lang="scss" scoped>
.style {
  border-bottom: 1px solid #ddd;
}
</style>
