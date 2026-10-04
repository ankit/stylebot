<template>
  <popup-row hover :disabled="disableToggle">
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
      <template v-else>{{ url }}</template>
    </s-toggle-switch>

    <span v-if="profiles.length > 1" class="profile-select" @click.stop>
      <s-select :text="activeName" :menu-min-width="160">
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
import {
  SMenuItem,
  SSelect,
  SShortcutKbd,
  SText,
  SToggleSwitch,
} from '@stylebot/components';
import { disableStyle, enableStyle, setActiveProfile } from '../utils';

export default Vue.extend({
  name: 'StyleComponent',

  components: {
    PopupRow,
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
.site-style-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-select {
  flex: none;
  cursor: default;
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
