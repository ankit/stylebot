<template>
  <popup-row :hover="profiles.length < 2" :disabled="disableToggle">
    <s-toggle-switch
      v-model="enabled"
      :disabled="disableToggle"
      :track-end="site"
      @change="onChange"
    >
      <span v-if="site" class="site-style-label">
        <s-text as="span" size="large">{{ name || t('style') }}</s-text>
        <span v-if="shortcut" class="shortcut-hint">
          <s-shortcut-kbd :value="shortcut" />
        </span>
      </span>
      <span v-else class="style-url">{{ url }}</span>
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
import { ComposeIcon } from '@stylebot/icons';
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
    PopupRow,
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
  },

  data(): {
    enabled: boolean;
    activeProfile: string;
  } {
    return {
      enabled: this.initialEnabled,
      activeProfile: this.profiles.find(profile => profile.active)?.id ?? '',
    };
  },

  computed: {
    activeName(): string {
      const active = this.profiles.find(
        profile => profile.id === this.activeProfile
      );

      return active ? this.displayName(active) : '';
    },
  },

  methods: {
    openStyleInOptions,

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

.shortcut-hint {
  display: inline-flex;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.12s ease;
}

.popup-row:hover .shortcut-hint,
.popup-row:focus-within .shortcut-hint {
  opacity: 1;
}
</style>
