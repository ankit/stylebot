<template>
  <div class="profile-switcher">
    <span class="separator" aria-hidden="true">/</span>

    <s-anchored-menu
      class="profile-anchor"
      align="start"
      :boundary="header"
      :keep-open-on-escape="editing !== null || !!rowMenu"
      @escape="onEscape"
      @close="reset"
    >
      <template #trigger="{ toggle, open }">
        <button
          type="button"
          class="trigger"
          :class="{ open }"
          :aria-label="t('switch_profile')"
          :aria-expanded="open ? 'true' : 'false'"
          @click="toggle"
        >
          <span class="trigger-name">{{ activeName }}</span>
          <chevron-down-icon :size="10" class="trigger-chevron" />
        </button>
      </template>

      <template #default="{ close }">
        <div
          ref="panel"
          class="profile-panel"
          tabindex="-1"
          @mousedown="onPanelMousedown"
        >
          <s-menu dense class="profile-list">
            <profile
              v-for="profile in profiles"
              :key="profile.id"
              v-model="draft"
              :name="displayName(profile)"
              :active="profile.id === activeProfile"
              :editing="editing === profile.id"
              :menu-open="!!rowMenu && rowMenu.id === profile.id"
              :error="nameError"
              @pick="
                switchProfile(profile.id);
                close();
              "
              @more="toggleRowMenu(profile.id, $event)"
              @submit="submitEdit(close)"
            />

            <s-menu-divider />

            <profile
              v-model="draft"
              :name="t('create_profile')"
              muted
              :actions="false"
              :editing="editing === NEW_ID"
              :error="nameError"
              @pick="startCreate"
              @submit="submitEdit(close)"
            />
          </s-menu>

          <profile-menu
            v-if="rowMenu"
            :top="rowMenu.top"
            :can-delete="profiles.length > 1"
            @rename="startRename(rowMenu.id)"
            @duplicate="duplicate(rowMenu.id, close)"
            @delete="confirmDelete(rowMenu.id, close)"
          />
        </div>
      </template>
    </s-anchored-menu>

    <s-confirm-dialog
      v-if="deleteTarget"
      contained
      :title="t('delete_profile')"
      :message="t('delete_profile_warning', [displayName(deleteTarget)])"
      :confirm-label="t('delete')"
      :cancel-label="t('cancel')"
      @confirm="onDeleteConfirm"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  SAnchoredMenu,
  SMenu,
  SMenuDivider,
  SConfirmDialog,
} from '@stylebot/components';
import { ChevronDownIcon } from '@stylebot/icons';
import { freeProfileName, isProfileNameTaken } from '@stylebot/saved-styles';

import type { EditorProfile } from '../../store';
import Profile from './Profile.vue';
import ProfileMenu from './ProfileMenu.vue';

// Stands for the row being typed into by Create profile.
const NEW_ID = '';

export default Vue.extend({
  name: 'TheProfileSwitcher',

  components: {
    SAnchoredMenu,
    SMenu,
    SMenuDivider,
    SConfirmDialog,
    ChevronDownIcon,
    Profile,
    ProfileMenu,
  },

  data(): {
    NEW_ID: string;
    // The id of the profile being renamed, NEW_ID while one is being
    // created, or null.
    editing: string | null;
    draft: string;
    rowMenu: { id: string; top: number } | null;
    deleteTarget: EditorProfile | null;
  } {
    return {
      NEW_ID,
      editing: null,
      draft: '',
      rowMenu: null,
      deleteTarget: null,
    };
  },

  computed: {
    profiles(): Array<EditorProfile> {
      return this.$store.state.profiles;
    },

    activeProfile(): string {
      return this.$store.state.activeProfile;
    },

    activeName(): string {
      const active = this.profiles.find(
        profile => profile.id === this.activeProfile
      );

      return active ? this.displayName(active) : '';
    },

    names(): Array<string> {
      return this.profiles.map(this.displayName);
    },

    nameError(): string {
      const others = this.profiles
        .filter(profile => profile.id !== this.editing)
        .map(this.displayName);

      return isProfileNameTaken(this.draft, others)
        ? this.t('profile_name_taken')
        : '';
    },
  },

  methods: {
    displayName(profile: EditorProfile): string {
      return profile.name || this.t('profile_default_name');
    },

    /**
     * The panel's header, which the menu stays inside however long the
     * site name.
     */
    header(): HTMLElement | null {
      return this.$el.closest('.header');
    },

    reset(): void {
      this.editing = null;
      this.rowMenu = null;
    },

    /**
     * Parks focus on the menu itself before a focused field or item is
     * removed, which would otherwise read as focus leaving and close it.
     */
    holdFocus(): void {
      (this.$refs.panel as HTMLElement | undefined)?.focus();
    },

    onEscape(): void {
      this.holdFocus();

      if (this.rowMenu) {
        this.rowMenu = null;
      } else {
        this.editing = null;
      }
    },

    onPanelMousedown(event: MouseEvent): void {
      const target = event.target as HTMLElement;

      if (!target.closest('.row-menu, .row-more')) {
        this.rowMenu = null;
      }
    },

    /**
     * Opens a row's own menu just below it, or closes it if it's open.
     */
    toggleRowMenu(id: string, event: MouseEvent): void {
      if (this.rowMenu?.id === id) {
        this.rowMenu = null;
        return;
      }

      const row = (event.currentTarget as HTMLElement).closest(
        '.profile-row'
      ) as HTMLElement;
      const panel = this.$refs.panel as HTMLElement;

      this.editing = null;
      this.rowMenu = {
        id,
        top:
          row.getBoundingClientRect().bottom -
          panel.getBoundingClientRect().top +
          2,
      };
    },

    /**
     * Swaps a row for a name field, which takes focus as it appears.
     */
    startEditing(id: string, draft: string): void {
      this.holdFocus();
      this.rowMenu = null;
      this.editing = id;
      this.draft = draft;
    },

    startRename(id: string): void {
      const profile = this.profiles.find(item => item.id === id);

      if (profile) {
        this.startEditing(id, this.displayName(profile));
      }
    },

    startCreate(): void {
      this.startEditing(
        NEW_ID,
        freeProfileName(this.t('untitled'), this.names)
      );
    },

    submitEdit(close: () => void): void {
      const name = this.draft.trim();

      if (!name || this.nameError || this.editing === null) {
        return;
      }

      if (this.editing === NEW_ID) {
        this.$store.dispatch('createProfile', { name });
        close();
        return;
      }

      const profile = this.profiles.find(item => item.id === this.editing);

      if (profile && name !== this.displayName(profile)) {
        this.$store.dispatch('renameProfile', { id: profile.id, name });
      }

      this.holdFocus();
      this.editing = null;
    },

    duplicate(id: string, close: () => void): void {
      const profile = this.profiles.find(item => item.id === id);

      if (profile) {
        this.$store.dispatch('createProfile', {
          name: freeProfileName(
            this.t('name_copy', [this.displayName(profile)]),
            this.names
          ),
          sourceProfileId: id,
        });
      }

      close();
    },

    confirmDelete(id: string, close: () => void): void {
      this.deleteTarget = this.profiles.find(item => item.id === id) ?? null;
      close();
    },

    switchProfile(id: string): void {
      this.$store.dispatch('switchProfile', id);
    },

    onDeleteConfirm(): void {
      if (this.deleteTarget) {
        this.$store.dispatch('deleteProfile', this.deleteTarget.id);
      }

      this.deleteTarget = null;
    },
  },
});
</script>

<style lang="scss" scoped>
.profile-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.profile-anchor {
  min-width: 0;
}

.separator {
  flex: none;
  font-size: 13px;
  color: var(--text-faint);
}

.trigger {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 160px;
  padding: 5px 8px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--text-primary);
  cursor: pointer;

  &:hover,
  &.open {
    background: var(--hover-tint);
  }

  @include focus-ring($target: ':not(.open)');
}

.trigger-name {
  @include truncate;

  min-width: 0;
}

.trigger-chevron {
  flex: none;
  color: var(--text-muted);
}

.profile-panel {
  position: relative;
  outline: none;
}

.profile-list {
  box-sizing: border-box;
  width: 220px;
}
</style>
