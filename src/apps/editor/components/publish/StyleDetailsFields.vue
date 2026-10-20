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

      <username-field
        :username="username"
        :current="currentUsername"
        :tooltip="update"
        @update:username="$emit('update:username', $event)"
        @update:unavailable="$emit('update:usernameUnavailable', $event)"
      />
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SHeading, STextInput } from '@stylebot/components';
import {
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NOTES_MAX_LENGTH,
} from '@stylebot/gallery';

import GalleryField from './GalleryField.vue';
import UsernameField from './UsernameField.vue';

/**
 * The style's details for the Gallery, each bound with `.sync`: its name,
 * description and the author's username, with `usernameUnavailable` while
 * the typed one can't be taken. An update asks what changed first, above the
 * details it set last time.
 */
export default Vue.extend({
  name: 'StyleDetailsFields',

  components: {
    SHeading,
    STextInput,
    GalleryField,
    UsernameField,
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

    username: {
      type: String,
      required: true,
    },

    currentUsername: {
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
