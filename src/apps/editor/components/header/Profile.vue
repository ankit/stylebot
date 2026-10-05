<template>
  <div
    class="profile-row"
    :class="{ active, muted, editing, 'menu-open': menuOpen }"
    @click="editing || $emit('pick')"
  >
    <span class="check-slot">
      <check-icon v-if="active" :size="12" />
    </span>

    <profile-name-input
      v-if="editing"
      :value="value"
      :error="error"
      @input="$emit('input', $event)"
      @submit="$emit('submit')"
    />
    <template v-else>
      <button
        type="button"
        class="row-name"
        role="menuitem"
        tabindex="-1"
        :aria-current="active ? 'true' : undefined"
      >
        {{ name }}
      </button>

      <button
        v-if="actions"
        type="button"
        class="row-more"
        tabindex="-1"
        :aria-label="t('profile_actions')"
        aria-haspopup="menu"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        @click.stop="$emit('more', $event)"
      >
        <more-icon :size="14" />
      </button>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { CheckIcon, MoreIcon } from '@stylebot/icons';

import ProfileNameInput from './ProfileNameInput.vue';

/**
 * One row of the profile menu: a profile, or Create profile, which swaps its
 * label for a name field while it's being named.
 */
export default Vue.extend({
  name: 'Profile',

  components: {
    CheckIcon,
    MoreIcon,
    ProfileNameInput,
  },

  props: {
    name: {
      type: String,
      required: true,
    },

    active: Boolean,
    muted: Boolean,
    editing: Boolean,
    menuOpen: Boolean,

    // Whether the row has a ••• for its own actions.
    actions: {
      type: Boolean,
      default: true,
    },

    // The name being typed while editing.
    value: {
      type: String,
      default: '',
    },

    error: {
      type: String,
      default: '',
    },
  },
});
</script>

<style lang="scss" scoped>
.profile-row {
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
  &.menu-open {
    background: var(--field-surface-hover);
  }

  &.active {
    font-weight: 500;
    color: var(--text-primary);
  }

  &.muted {
    color: var(--text-muted);

    &:hover {
      color: var(--text-primary);
    }
  }

  &.editing {
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
</style>
