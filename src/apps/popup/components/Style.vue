<template>
  <popup-row
    :hover="profiles.length < 2"
    :disabled="disableToggle"
    :class="{ 'menu-open': menuOpen }"
  >
    <s-toggle-switch
      v-model="enabled"
      :disabled="disableToggle"
      :track-end="site"
      @change="onChange"
    >
      <span v-if="site" class="site-style-label">
        <profile-name-input
          v-if="renaming"
          v-model="draft"
          @submit="submitRename"
          @cancel="renaming = false"
        />
        <template v-else>
          <s-text as="span" size="large" class="site-style-name">
            {{ displayedName }}
          </s-text>
          <span v-if="shortcut" class="shortcut-hint">
            <s-shortcut-kbd :value="shortcut" />
          </span>
        </template>
      </span>
      <span v-else class="style-url">{{ url }}</span>

      <template v-if="site" #trailing>
        <span ref="actions" class="row-actions" @click.prevent.stop>
          <button
            ref="more"
            type="button"
            class="row-more"
            :aria-label="t('profile_actions')"
            aria-haspopup="menu"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            @click="menuOpen = !menuOpen"
          >
            <more-icon :size="16" />
          </button>

          <profile-menu
            v-if="menuOpen"
            deletes-style
            :publish-item="publishItem"
            @click.native.prevent
            @edit="act('edit')"
            @rename="startRename"
            @publish="act('publish')"
            @delete="act('delete')"
            @close="closeMenu"
          />
        </span>
      </template>
    </s-toggle-switch>

    <span v-if="editable" class="edit-button" @click.stop>
      <s-icon-button
        :size="28"
        :tooltip="t('edit_in_options')"
        @click="openStyleInOptions(url)"
      >
        <compose-icon />
      </s-icon-button>
    </span>

    <span v-if="profiles.length > 1" class="profile-select" @click.stop>
      <s-select full-width :text="activeName" :menu-min-width="160">
        <template #default="{ close }">
          <s-menu-item
            v-for="profile in profiles"
            :key="profile.id"
            :selected="profile.id === activeProfile"
            @click="
              switchProfile(profile.id);
              close();
            "
          >
            {{ displayName(profile) }}
          </s-menu-item>
        </template>
      </s-select>
    </span>
  </popup-row>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import type { ProfileSummary } from '@stylebot/saved-styles';
import PopupRow from './PopupRow.vue';
import { ComposeIcon, MoreIcon } from '@stylebot/icons';
import type { GalleryMenuItem } from '@stylebot/gallery';
import ProfileMenu from './ProfileMenu.vue';
import ProfileNameInput from './ProfileNameInput.vue';
import {
  SIconButton,
  SMenuItem,
  SSelect,
  SShortcutKbd,
  SText,
  SToggleSwitch,
} from '@stylebot/components';
import {
  disableStyle,
  enableStyle,
  openStyleInOptions,
  setActiveProfile,
} from '../utils';

export default Vue.extend({
  name: 'StyleComponent',

  components: {
    ComposeIcon,
    MoreIcon,
    PopupRow,
    ProfileMenu,
    ProfileNameInput,
    SIconButton,
    SToggleSwitch,
    SShortcutKbd,
    SText,
    SSelect,
    SMenuItem,
  },

  props: {
    url: {
      type: String,
      required: true,
    },
    disableToggle: {
      type: Boolean,
    },
    initialEnabled: {
      type: Boolean,
    },
    // The page's own style, when it has a single profile: an on/off row
    // labelled by the profile's name, or "Style" until it has one.
    site: {
      type: Boolean,
    },
    name: {
      type: String,
      default: '',
    },
    shortcut: {
      type: String,
      default: '',
    },
    // A broader style, which the page's editor can't open, edits in Options.
    editable: {
      type: Boolean,
    },
    profiles: {
      type: Array as PropType<Array<ProfileSummary>>,
      default: () => [],
    },
    publishItem: {
      type: Object as PropType<GalleryMenuItem | null>,
      default: null,
    },
  },

  data(): {
    enabled: boolean;
    activeProfile: string;
    menuOpen: boolean;
    renaming: boolean;
    draft: string;
  } {
    return {
      enabled: this.initialEnabled,
      activeProfile: this.profiles.find(profile => profile.active)?.id ?? '',
      menuOpen: false,
      renaming: false,
      draft: '',
    };
  },

  computed: {
    displayedName(): string {
      return this.name || this.t('style');
    },

    activeName(): string {
      const active = this.profiles.find(
        profile => profile.id === this.activeProfile
      );

      return active ? this.displayName(active) : '';
    },
  },

  watch: {
    menuOpen(open: boolean): void {
      if (open) {
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
    openStyleInOptions,

    onDocumentMousedown(event: MouseEvent): void {
      const actions = this.$refs.actions as HTMLElement | undefined;

      if (!actions?.contains(event.target as Node)) {
        this.menuOpen = false;
      }
    },

    /**
     * Closes the menu and hands focus back to the ••• that opened it.
     */
    closeMenu(): void {
      this.menuOpen = false;
      (this.$refs.more as HTMLElement | undefined)?.focus();
    },

    act(action: 'edit' | 'publish' | 'delete'): void {
      this.menuOpen = false;
      this.$emit(action);
    },

    startRename(): void {
      this.menuOpen = false;
      this.draft = this.displayedName;
      this.renaming = true;
    },

    submitRename(): void {
      const name = this.draft.trim();

      if (!this.renaming) {
        return;
      }

      this.renaming = false;

      if (name && name !== this.displayedName) {
        this.$emit('rename', name);
      }
    },

    displayName(profile: ProfileSummary): string {
      return profile.name || this.t('profile_default_name');
    },

    switchProfile(id: string): void {
      if (id !== this.activeProfile) {
        this.activeProfile = id;
        setActiveProfile(this.url, id);
      }
    },

    onChange(): void {
      if (this.enabled) {
        enableStyle(this.url);
      } else {
        disableStyle(this.url);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.popup-row .switch:not(.switch--track-end) {
  flex: 0 0 auto;
  width: auto;
  min-width: 0;
  max-width: 55%;
}

.style-url {
  @include truncate;

  display: block;
}

.site-style-label {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.profile-select {
  --field-surface: var(--card-field-surface-hover);
  --field-surface-hover: var(--field-border);

  display: flex;
  flex: 0 1 auto;
  min-width: 72px;
  margin-left: auto;
  cursor: default;

  @include dark-mode {
    --field-surface: var(--card-field-surface-hover);
    --field-surface-hover: var(--field-surface-active);
  }
}

.edit-button {
  display: flex;
  flex: none;
  margin: -6px -6px -6px -10px;
  color: var(--icon-color);
}

.site-style-label .name-input {
  position: static;
  margin-top: -3px;
  margin-bottom: -3px;
  overflow: visible;
  clip: auto;
}

.site-style-name {
  @include truncate;

  min-width: 0;
}

.row-actions {
  position: relative;
  display: flex;
  flex: none;
  cursor: default;
}

.row-more {
  @include button-reset;

  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  color: var(--text-muted);
  opacity: var(--row-extras-shown, 0);
  cursor: pointer;

  &:hover,
  .menu-open & {
    color: var(--text-primary);
  }

  @include focus-ring;
}

.popup-row:hover,
.popup-row:has(:focus-visible),
.popup-row.menu-open {
  --row-extras-shown: 1;
}

.popup-row.menu-open {
  background: var(--hover-tint);
}

.shortcut-hint {
  display: inline-flex;
  color: var(--text-muted);
  opacity: var(--row-extras-shown, 0);
  transition: opacity 0.12s ease;
}
</style>
