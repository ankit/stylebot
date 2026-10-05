<template>
  <div class="site-profiles">
    <div class="popup-header site-header">
      <s-heading as="h1" size="md" class="site-domain">{{ url }}</s-heading>
      <options-button />
    </div>

    <div class="popup-divider" />

    <div
      class="profile-list"
      :class="{ 'profile-list--joined': joined }"
      role="radiogroup"
      :aria-label="url"
    >
      <button
        type="button"
        role="radio"
        class="profile-option"
        :class="{ checked: !enabled }"
        :aria-checked="enabled ? 'false' : 'true'"
        :disabled="disableOff"
        @click="$emit('pick', null)"
      >
        <s-text as="span" size="large" class="profile-name">
          {{ t('no_style') }}
        </s-text>
        <span class="check-slot" aria-hidden="true">
          <check-icon v-if="!enabled" :size="13" />
        </span>
      </button>

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
        <s-text as="span" size="large" class="profile-name">
          {{ displayName(profile) }}
        </s-text>
        <span class="check-slot" aria-hidden="true">
          <check-icon
            v-if="enabled && profile.id === activeProfile"
            :size="13"
          />
        </span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SHeading, SText } from '@stylebot/components';
import { CheckIcon } from '@stylebot/icons';
import OptionsButton from './OptionsButton.vue';
import type { ProfileSummary } from '@stylebot/saved-styles';

export default Vue.extend({
  name: 'SiteProfiles',

  components: {
    SHeading,
    SText,
    CheckIcon,
    OptionsButton,
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

    // While the editor is open it keeps the style on, so turning it off waits.
    disableOff: {
      type: Boolean,
      default: false,
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
  display: flex;
  flex-direction: column;
  padding: 6px;

  &.profile-list--joined {
    padding-bottom: 0;
  }
}

.profile-option {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 12px;
  height: 34px;
  padding: 0 10px;
  border-radius: 7px;
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

  flex: 1;
  min-width: 0;

  .checked & {
    font-weight: 600;
  }
}
</style>
