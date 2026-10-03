<template>
  <div class="profile-switcher">
    <span class="separator" aria-hidden="true">/</span>

    <s-anchored-menu
      class="profile-anchor"
      :style="{ '--menu-shift': `${menuShift}px` }"
      :keep-open-on-escape="!!editing || !!rowMenu"
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
          @click="toggleMenu($event, toggle)"
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
          <s-menu dense class="profile-menu">
            <div
              v-for="profile in profiles"
              :key="profile.id"
              class="profile-row"
              :class="{
                active: profile.id === activeProfile,
                'menu-open': rowMenu && rowMenu.id === profile.id,
              }"
              @click="
                switchProfile(profile.id);
                close();
              "
            >
              <span class="check-slot">
                <check-icon v-if="profile.id === activeProfile" :size="12" />
              </span>

              <input
                v-if="editing && editing.id === profile.id"
                ref="nameInput"
                v-model="draft"
                class="row-input"
                :class="{ invalid: !!nameError }"
                :aria-label="t('profile_name')"
                :aria-invalid="nameError ? 'true' : 'false'"
                :title="nameError"
                @click.stop
                @keydown.enter.prevent="submitEdit(close)"
              />
              <template v-else>
                <button
                  type="button"
                  class="row-name"
                  role="menuitem"
                  tabindex="-1"
                  :aria-current="
                    profile.id === activeProfile ? 'true' : undefined
                  "
                >
                  {{ displayName(profile) }}
                </button>

                <button
                  type="button"
                  class="row-more"
                  tabindex="-1"
                  :aria-label="t('profile_actions')"
                  aria-haspopup="menu"
                  :aria-expanded="
                    rowMenu && rowMenu.id === profile.id ? 'true' : 'false'
                  "
                  @click.stop="toggleRowMenu(profile, $event)"
                >
                  <more-icon :size="14" />
                </button>
              </template>
            </div>

            <s-menu-divider />

            <div v-if="editing && editing.id === NEW_ID" class="profile-row">
              <span class="check-slot" />
              <input
                ref="nameInput"
                v-model="draft"
                class="row-input"
                :class="{ invalid: !!nameError }"
                :aria-label="t('profile_name')"
                :aria-invalid="nameError ? 'true' : 'false'"
                :title="nameError"
                @keydown.enter.prevent="submitEdit(close)"
              />
            </div>
            <button
              v-if="!(editing && editing.id === NEW_ID && inputFocused)"
              type="button"
              class="profile-row create-row"
              role="menuitem"
              tabindex="-1"
              @click="startCreate"
            >
              <span class="check-slot" />
              {{ t('create_profile') }}
            </button>
          </s-menu>

          <s-menu
            v-if="rowMenu"
            ref="rowMenu"
            dense
            :min-width="132"
            class="row-menu"
            :style="{ top: `${rowMenu.top}px` }"
          >
            <s-menu-item @click="startRename(rowMenu.id)">
              {{ t('rename') }}
            </s-menu-item>
            <s-menu-item @click="duplicate(rowMenu.id, close)">
              {{ t('duplicate') }}
            </s-menu-item>
            <s-menu-item
              v-if="profiles.length > 1"
              danger
              @click="confirmDelete(rowMenu.id, close)"
            >
              {{ t('delete') }}
            </s-menu-item>
          </s-menu>
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
  SMenuItem,
  SMenuDivider,
  SConfirmDialog,
} from '@stylebot/components';
import { CheckIcon, ChevronDownIcon, MoreIcon } from '@stylebot/icons';

import type { EditorProfile } from '../../store';

const MENU_WIDTH = 220;
const MENU_EDGE_GAP = 8;
// Stands for the row being typed into by Create profile.
const NEW_ID = '';

export default Vue.extend({
  name: 'TheProfileSwitcher',

  components: {
    SAnchoredMenu,
    SMenu,
    SMenuItem,
    SMenuDivider,
    SConfirmDialog,
    CheckIcon,
    ChevronDownIcon,
    MoreIcon,
  },

  data(): {
    NEW_ID: string;
    menuShift: number;
    editing: { id: string } | null;
    draft: string;
    // Create profile stays a button until its field has focus: removing the
    // focused element would blur out of the menu and close it.
    inputFocused: boolean;
    rowMenu: { id: string; top: number } | null;
    deleteTarget: EditorProfile | null;
  } {
    return {
      NEW_ID,
      menuShift: 0,
      editing: null,
      draft: '',
      inputFocused: false,
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

    nameError(): string {
      const name = this.draft.trim().toLowerCase();
      const editingId = this.editing?.id;
      const taken = this.profiles.some(
        profile =>
          profile.id !== editingId &&
          this.displayName(profile).toLowerCase() === name
      );

      return taken ? this.t('profile_name_taken') : '';
    },
  },

  methods: {
    displayName(profile: EditorProfile): string {
      return profile.name || this.t('profile_default_name');
    },

    /**
     * The name, or the name with the first number that makes it unique.
     */
    freeName(name: string): string {
      const taken = new Set(
        this.profiles.map(profile => this.displayName(profile).toLowerCase())
      );
      let candidate = name;

      for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
        candidate = `${name} ${n}`;
      }

      return candidate;
    },

    /**
     * Opens or closes the menu, shifting it left first when a long site
     * name leaves too little room for it beside the trigger.
     */
    toggleMenu(event: MouseEvent, toggle: () => void): void {
      const trigger = event.currentTarget as HTMLElement;
      const bounds = (
        trigger.closest('.header') ?? document.body
      ).getBoundingClientRect();
      const room =
        bounds.right - MENU_EDGE_GAP - trigger.getBoundingClientRect().left;

      this.menuShift = Math.min(0, room - MENU_WIDTH);
      toggle();
    },

    reset(): void {
      this.editing = null;
      this.inputFocused = false;
      this.rowMenu = null;
    },

    /**
     * Parks focus on the menu itself before a focused field or item is
     * removed, which would otherwise read as focus leaving and close it.
     */
    holdFocus(): void {
      (this.$refs.panel as HTMLElement | undefined)?.focus();
    },

    stopEditing(): void {
      this.holdFocus();
      this.editing = null;
      this.inputFocused = false;
    },

    onEscape(): void {
      if (this.rowMenu) {
        this.holdFocus();
        this.rowMenu = null;
      } else {
        this.stopEditing();
      }
    },

    onPanelMousedown(event: MouseEvent): void {
      const rowMenu = (this.$refs.rowMenu as Vue | undefined)?.$el;
      const target = event.target as HTMLElement;

      if (
        this.rowMenu &&
        !rowMenu?.contains(target) &&
        !target.closest('.row-more')
      ) {
        this.rowMenu = null;
      }
    },

    /**
     * Opens a row's own menu just below it, or closes it if it's open.
     */
    toggleRowMenu(profile: EditorProfile, event: MouseEvent): void {
      if (this.rowMenu?.id === profile.id) {
        this.rowMenu = null;
        return;
      }

      const row = (event.currentTarget as HTMLElement).closest(
        '.profile-row'
      ) as HTMLElement;
      const panel = this.$refs.panel as HTMLElement;

      this.editing = null;
      this.rowMenu = {
        id: profile.id,
        top:
          row.getBoundingClientRect().bottom -
          panel.getBoundingClientRect().top +
          2,
      };

      this.$nextTick(() => {
        const rowMenu = (this.$refs.rowMenu as Vue | undefined)?.$el;
        rowMenu?.querySelector<HTMLElement>('button')?.focus();
      });
    },

    /**
     * Puts a field in place of a row and focuses it, only then dropping the
     * row menu so focus never leaves the menu.
     */
    startEditing(id: string, draft: string): void {
      this.editing = { id };
      this.draft = draft;
      this.inputFocused = false;

      this.$nextTick(() => {
        const input = this.$refs.nameInput as
          | HTMLInputElement
          | Array<HTMLInputElement>
          | undefined;
        const field = Array.isArray(input) ? input[0] : input;

        field?.focus();
        field?.select();
        this.inputFocused = true;
        this.rowMenu = null;
      });
    },

    startRename(id: string): void {
      const profile = this.profiles.find(item => item.id === id);

      if (profile) {
        this.startEditing(id, this.displayName(profile));
      }
    },

    startCreate(): void {
      this.startEditing(NEW_ID, this.freeName(this.t('untitled')));
    },

    submitEdit(close: () => void): void {
      const name = this.draft.trim();

      if (!name || this.nameError || !this.editing) {
        return;
      }

      if (this.editing.id === NEW_ID) {
        this.$store.dispatch('createProfile', { name });
        close();
        return;
      }

      const profile = this.profiles.find(item => item.id === this.editing?.id);

      if (profile && name !== this.displayName(profile)) {
        this.$store.dispatch('renameProfile', { id: profile.id, name });
      }

      this.stopEditing();
    },

    duplicate(id: string, close: () => void): void {
      const profile = this.profiles.find(item => item.id === id);

      if (profile) {
        this.$store.dispatch('createProfile', {
          name: this.freeName(this.t('name_copy', [this.displayName(profile)])),
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

  ::v-deep .anchored-menu-panel {
    right: auto;
    left: var(--menu-shift);
  }
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

.profile-menu {
  box-sizing: border-box;
  width: 220px;
}

.profile-row {
  @include button-reset;

  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  height: 28px;
  padding: 0 3px 0 8px;
  border-radius: 7px;
  font-size: 13px;
  line-height: 1;
  color: var(--text-body);
  cursor: pointer;

  &:hover,
  &:has(.row-name:focus-visible, .row-more:focus-visible),
  &.menu-open,
  &.active {
    background: var(--field-surface-hover);
  }

  &.active {
    font-weight: 500;
    color: var(--text-primary);
  }

  &:has(.row-input) {
    background: none;
  }
}

.check-slot {
  display: flex;
  justify-content: center;
  flex: none;
  width: 12px;
  color: var(--accent-text);
}

.row-name {
  @include button-reset;
  @include truncate;

  flex: 1;
  min-width: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.row-more {
  @include button-reset;

  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  color: var(--text-muted);
  opacity: 0;
  cursor: pointer;

  .profile-row:hover &,
  .profile-row:has(.row-name:focus-visible) &,
  .menu-open &,
  &:focus-visible {
    opacity: 1;
  }

  &:hover,
  .menu-open & {
    color: var(--text-primary);
    background: var(--field-surface-active);
  }
}

.row-input {
  flex: 1;
  width: 0;
  min-width: 0;
  height: 24px;
  margin-left: -6px;
  padding: 0 6px;
  border: none;
  border-radius: 6px;
  outline: none;
  font: inherit;
  color: var(--text-primary);
  background: var(--field-surface);
  box-shadow: 0 0 0 1.5px var(--accent);

  &.invalid {
    box-shadow: 0 0 0 1.5px var(--danger);
  }
}

.create-row {
  color: var(--text-muted);

  &:hover,
  &:focus-visible {
    color: var(--text-primary);
  }
}

.row-menu {
  position: absolute;
  right: 4px;
  z-index: 1;
}
</style>
