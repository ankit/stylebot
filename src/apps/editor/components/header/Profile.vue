<template>
  <div
    class="profile-row"
    :class="{ active, editing, 'menu-open': menuOpen }"
    @click="editing || $emit('pick')"
  >
    <profile-name-input
      v-if="editing"
      :value="value"
      :error="error"
      @input="$emit('input', $event)"
      @submit="$emit('submit')"
    />
    <template v-else>
      <button
        ref="name"
        type="button"
        class="row-name"
        role="menuitem"
        tabindex="-1"
        :aria-current="active ? 'true' : undefined"
        @keydown.right="focusMore"
      >
        {{ name }}
      </button>

      <span v-if="active || actions" class="row-end">
        <check-icon v-if="active" :size="14" class="row-check" />

        <button
          v-if="actions"
          ref="more"
          type="button"
          class="row-more"
          tabindex="-1"
          data-menu-secondary
          :aria-label="t('profile_actions')"
          aria-haspopup="menu"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          @click.stop="$emit('more', $event)"
          @keydown.left="focusName"
        >
          <more-icon :size="14" />
        </button>
      </span>
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

  methods: {
    focusMore(): void {
      (this.$refs.more as HTMLElement | undefined)?.focus();
    },

    focusName(): void {
      (this.$refs.name as HTMLElement | undefined)?.focus();
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
    background: var(--menu-item-hover);
  }

  &.active {
    font-weight: 500;
    color: var(--text-primary);
  }

  &.editing {
    background: none;
  }
}

.row-end {
  display: grid;
  place-items: center;
  flex: none;
}

.row-check {
  grid-area: 1 / 1;
  color: var(--accent-text);
  pointer-events: none;

  &:has(+ .row-more) {
    .profile-row:hover &,
    .profile-row:has(.row-name:focus-visible, .row-more:focus-visible) &,
    .menu-open & {
      opacity: 0;
    }
  }
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

  grid-area: 1 / 1;
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
  &:focus-visible,
  .menu-open & {
    color: var(--text-primary);
    background: var(--field-surface-active);
  }
}
</style>
