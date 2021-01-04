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

    <b-col cols="7">
      <b-form-checkbox v-model="enabled" @change="$emit('toggle')">
        {{ url }}
      </b-form-checkbox>

      <span class="style-timestamp">updated {{ formattedTimestamp }}</span>
    </b-col>

    <b-col cols="5">
      <b-row align-h="end">
        <app-button
          class="mr-2"
          size="sm"
          variant="outline-primary"
          @click="edit = true"
        >
          {{ t('open_edit_style_dialog') }}
        </app-button>

        <style-delete-button :url="url" @click="$emit('delete')" />
      </b-row>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';

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

  props: {
    url: {
      type: String,
      required: true,
    },
    css: {
      type: String,
      required: true,
    },
    modifiedTime: {
      type: String,
      required: true,
    },
    initialEnabled: Boolean,
    initialReadability: Boolean,
  },

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

  computed: {
    formattedTimestamp(): string {
      return formatDistanceToNow(new Date(this.modifiedTime), {
        addSuffix: true,
      });
    },
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

.style-timestamp {
  color: #555;
  font-size: 12px;
  font-style: italic;
  margin-left: 24px;
}
</style>
