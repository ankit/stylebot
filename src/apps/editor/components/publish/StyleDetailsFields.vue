<template>
  <div class="details">
    <gallery-field v-if="update" :label="t('what_changed')" optional>
      <s-text-input
        :value="notes"
        :maxlength="notesMaxLength"
        @input="$emit('update:notes', $event)"
      />
    </gallery-field>

    <section class="gallery-details" :class="{ update }">
      <s-heading v-if="update" as="h3" size="sm">
        {{ t('gallery_details') }}
      </s-heading>

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

      <gallery-field
        :label="t('author')"
        :hint="update ? '' : authorHint"
        :tooltip="update ? authorHint : ''"
      >
        <s-text-input
          :value="displayName"
          :placeholder="t('anonymous')"
          :maxlength="displayNameMaxLength"
          @input="$emit('update:displayName', $event)"
          @change="$emit('author-change')"
        />
      </gallery-field>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SHeading, STextInput } from '@stylebot/components';
import {
  DESCRIPTION_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NOTES_MAX_LENGTH,
} from '@stylebot/gallery';

import GalleryField from './GalleryField.vue';

/**
 * The style's details for the Gallery, each bound with `.sync`: its name,
 * description and the author's alias, which emits `author-change` once
 * edited. An update asks what changed first, above the details it set last
 * time.
 */
export default Vue.extend({
  name: 'StyleDetailsFields',

  components: {
    SHeading,
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
    authorHint(): string {
      return this.t('changes_the_name_on_all_your_published_styles');
    },

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
.details,
.gallery-details {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.gallery-details.update {
  gap: 14px;
  padding-top: 18px;
  border-top: 1px solid var(--panel-border);
}
</style>
