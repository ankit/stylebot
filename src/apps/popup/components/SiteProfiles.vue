<template>
  <div class="site-profiles">
    <div class="popup-header site-header">
      <s-heading as="h1" size="md" class="site-domain">{{ url }}</s-heading>
      <options-button />
    </div>

    <div class="popup-divider" />

    <div
      class="profile-list"
      :class="{ 'profile-list--joined': joined, previewing }"
    >
      <div class="profile-options" role="radiogroup" :aria-label="url">
        <profile-row
          :name="t('no_style')"
          :checked="!enabled"
          :disabled="disableOff"
          :actions="false"
          @pick="$emit('pick', null)"
        />

        <profile-row
          v-for="profile in profiles"
          :key="profile.id"
          v-model="draft"
          :name="displayName(profile)"
          :checked="enabled && profile.id === activeProfile"
          :menu-open="menuFor === profile.id"
          :renaming="renaming === profile.id"
          :error="nameError"
          :publish-item="publishItems[profile.id] || null"
          @pick="$emit('pick', profile.id)"
          @more="toggleMenu(profile.id)"
          @close-menu="menuFor = null"
          @edit="edit(profile.id)"
          @publish="publish(profile.id)"
          @rename="startRename(profile)"
          @delete="remove(profile.id)"
          @submit="submitRename"
          @cancel="renaming = null"
        />
      </div>

      <create-profile :names="names" @create="$emit('create', $event)" />
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SHeading } from '@stylebot/components';
import { isProfileNameTaken } from '@stylebot/saved-styles';
import type { ProfileSummary } from '@stylebot/saved-styles';

import type { GalleryMenuItem } from '@stylebot/gallery';

import OptionsButton from './OptionsButton.vue';
import ProfileRow from './ProfileRow.vue';
import CreateProfile from './CreateProfile.vue';

export default Vue.extend({
  name: 'SiteProfiles',

  components: {
    SHeading,
    OptionsButton,
    ProfileRow,
    CreateProfile,
  },

  props: {
    url: {
      type: String,
      required: true,
    },

    profiles: {
      type: Array as PropType<Array<ProfileSummary>>,
      required: true,
    },

    activeProfile: {
      type: String,
      required: true,
    },

    enabled: {
      type: Boolean,
      required: true,
    },

    // Rows follow straight on below the list, as more items of the same group.
    joined: {
      type: Boolean,
      default: false,
    },

    publishItems: {
      type: Object as PropType<Record<string, GalleryMenuItem | null>>,
      default: () => ({}),
    },

    // A gallery preview is on the page, so the saved pick's check greys out.
    previewing: {
      type: Boolean,
      default: false,
    },

    // While the editor is open it keeps the style on, so turning it off waits.
    disableOff: {
      type: Boolean,
      default: false,
    },
  },

  data(): {
    // The profile whose ••• menu is open, or null.
    menuFor: string | null;
    // The profile being renamed, or null.
    renaming: string | null;
    draft: string;
  } {
    return {
      menuFor: null,
      renaming: null,
      draft: '',
    };
  },

  computed: {
    names(): Array<string> {
      return this.profiles.map(this.displayName);
    },

    nameError(): string {
      const others = this.profiles
        .filter(profile => profile.id !== this.renaming)
        .map(this.displayName);

      return isProfileNameTaken(this.draft, others)
        ? this.t('profile_name_taken')
        : '';
    },
  },

  watch: {
    menuFor(id: string | null): void {
      if (id) {
        document.addEventListener('mousedown', this.onDocumentMousedown);
      } else {
        document.removeEventListener('mousedown', this.onDocumentMousedown);
      }
    },
  },

  beforeDestroy() {
    document.removeEventListener('mousedown', this.onDocumentMousedown);
  },

  methods: {
    displayName(profile: ProfileSummary): string {
      return profile.name || this.t('profile_default_name');
    },

    toggleMenu(id: string): void {
      this.menuFor = this.menuFor === id ? null : id;
    },

    onDocumentMousedown(event: MouseEvent): void {
      const target = event.target as HTMLElement;

      if (!target.closest('.row-menu, .row-more')) {
        this.menuFor = null;
      }
    },

    edit(id: string): void {
      this.menuFor = null;
      this.$emit('edit', id);
    },

    publish(id: string): void {
      this.menuFor = null;
      this.$emit('publish', id);
    },

    startRename(profile: ProfileSummary): void {
      this.menuFor = null;
      this.renaming = profile.id;
      this.draft = this.displayName(profile);
    },

    submitRename(): void {
      const profile = this.profiles.find(({ id }) => id === this.renaming);
      const name = this.draft.trim();

      if (!profile) {
        return;
      }

      this.renaming = null;

      if (name && !this.nameError && name !== this.displayName(profile)) {
        this.$emit('rename', profile.id, name);
      }
    },

    remove(id: string): void {
      this.menuFor = null;
      this.$emit('delete', id);
    },
  },
});
</script>

<style lang="scss" scoped>
.site-header {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 12px;
}

.site-domain {
  @include truncate;

  flex: 1;
  min-width: 0;
}

.profile-list {
  padding: 6px;

  &.profile-list--joined {
    padding-bottom: 0;
  }
}

.profile-options {
  display: flex;
  flex-direction: column;
}
</style>
