<template>
  <div class="site-profiles">
    <div class="popup-header site-header">
      <s-heading as="h1" size="sm" class="site-domain">{{ url }}</s-heading>
      <s-text variant="muted">{{ summary }}</s-text>
    </div>

    <div class="popup-divider" />

    <div class="profile-list" role="radiogroup" :aria-label="url">
      <button
        v-for="profile in profiles"
        :key="profile.id"
        type="button"
        role="radio"
        class="profile-option"
        :class="{ checked: enabled && profile.id === activeProfile }"
        :aria-checked="
          enabled && profile.id === activeProfile ? 'true' : 'false'
        "
        @click="$emit('pick', profile.id)"
      >
        <span class="check-slot" aria-hidden="true">
          <check-icon
            v-if="enabled && profile.id === activeProfile"
            :size="13"
          />
        </span>
        <s-text as="span" class="profile-name">
          {{ displayName(profile) }}
        </s-text>
      </button>

      <button
        type="button"
        role="radio"
        class="profile-option off"
        :class="{ checked: !enabled }"
        :aria-checked="enabled ? 'false' : 'true'"
        :disabled="disableOff"
        @click="$emit('pick', null)"
      >
        <span class="check-slot" aria-hidden="true">
          <check-icon v-if="!enabled" :size="13" />
        </span>
        <s-text as="span" variant="muted" class="profile-name">
          {{ t('no_style') }}
        </s-text>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SHeading, SText } from '@stylebot/components';
import { CheckIcon } from '@stylebot/icons';
import type { ProfileSummary } from '@stylebot/saved-styles';

export default Vue.extend({
  name: 'SiteProfiles',

  components: {
    SHeading,
    SText,
    CheckIcon,
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

    // While the editor is open it keeps the style on, so turning it off waits.
    disableOff: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    summary(): string {
      if (!this.enabled) {
        return this.t('styling_off_on_this_site');
      }

      const active = this.profiles.find(
        profile => profile.id === this.activeProfile
      );

      return `${this.t('profile_count', [
        String(this.profiles.length),
      ])} · ${this.t('name_is_on', [active ? this.displayName(active) : ''])}`;
    },
  },

  methods: {
    displayName(profile: ProfileSummary): string {
      return profile.name || this.t('profile_default_name');
    },
  },
});
</script>

<style lang="scss" scoped>
.site-header {
  gap: 8px;
  padding: 16px 16px 14px;
}

.site-domain {
  @include truncate;
}

.profile-list {
  display: flex;
  flex-direction: column;
  padding: 6px;
}

.profile-option {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 14px;
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--hover-tint);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  @include focus-ring;
}

.check-slot {
  display: flex;
  justify-content: center;
  flex: none;
  width: 14px;
  color: var(--accent-text);
}

.profile-name {
  @include truncate;

  .checked & {
    font-weight: 600;
  }
}
</style>
