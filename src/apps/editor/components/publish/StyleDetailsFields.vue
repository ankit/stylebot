<template>
  <div class="details">
    <gallery-field :label="t('name')">
      <s-text-input
        :value="name"
        :maxlength="nameMaxLength"
        required
        @input="$emit('update:name', $event)"
      />
    </gallery-field>

    <gallery-field :label="t('description')" optional>
      <s-text-input
        multiline
        :value="description"
        :maxlength="descriptionMaxLength"
        @input="$emit('update:description', $event)"
      />
    </gallery-field>

    <gallery-field v-if="update" :label="t('what_changed')" optional>
      <s-text-input
        :value="notes"
        :maxlength="notesMaxLength"
        @input="$emit('update:notes', $event)"
      />
    </gallery-field>

    <gallery-field
      :label="t('author')"
      :hint="t('changes_the_name_on_all_your_published_styles')"
    >
      <s-text-input
        :value="displayName"
        :placeholder="t('anonymous')"
        :maxlength="displayNameMaxLength"
        @input="$emit('update:displayName', $event)"
        @change="$emit('author-change')"
      />
    </gallery-field>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { STextInput } from '@stylebot/components';
import {
  DESCRIPTION_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NOTES_MAX_LENGTH,
} from '@stylebot/gallery';

import GalleryField from './GalleryField.vue';

/**
 * The style's details for the Gallery, each bound with `.sync`: its name,
 * description, what changed (for an update) and the author's alias, which
 * emits `author-change` once edited.
 */
export default Vue.extend({
  name: 'StyleDetailsFields',

  components: {
    STextInput,
    GalleryField,
  },

  props: {
    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    notes: {
      type: String,
      required: true,
    },

    displayName: {
      type: String,
      required: true,
    },

    // A new version of a published style, which asks what changed.
    update: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    nameMaxLength(): number {
      return NAME_MAX_LENGTH;
    },

    descriptionMaxLength(): number {
      return DESCRIPTION_MAX_LENGTH;
    },

    notesMaxLength(): number {
      return NOTES_MAX_LENGTH;
    },

    displayNameMaxLength(): number {
      return DISPLAY_NAME_MAX_LENGTH;
    },
  },
});
</script>

<style lang="scss" scoped>
.details {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
</style>
