<template>
  <div
    class="profile-row"
    :class="{ checked, disabled, 'menu-open': menuOpen }"
  >
    <div v-if="renaming" class="profile-option">
      <input
        ref="input"
        :value="value"
        class="name-input"
        autocomplete="off"
        :class="{ invalid: !!error }"
        :aria-label="t('profile_name')"
        :aria-invalid="error ? 'true' : 'false'"
        :title="error"
        @input="onInput"
        @keydown.enter.prevent="$emit('submit')"
        @keydown.esc.prevent.stop="$emit('cancel')"
        @blur="$emit('submit')"
      />
      <span class="check-slot" aria-hidden="true">
        <check-icon v-if="checked" :size="16" />
      </span>
    </div>

    <button
      v-else
      type="button"
      role="radio"
      class="profile-option"
      :aria-checked="checked ? 'true' : 'false'"
      :disabled="disabled"
      @click="$emit('pick')"
    >
      <s-text as="span" size="large" class="profile-name">{{ name }}</s-text>
      <span class="check-slot" aria-hidden="true">
        <check-icon v-if="checked" :size="16" />
      </span>
    </button>

    <template v-if="actions">
      <button
        ref="more"
        type="button"
        class="row-more"
        :aria-label="t('profile_actions')"
        aria-haspopup="menu"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        @click="$emit('more')"
      >
        <more-icon :size="16" />
      </button>

      <profile-menu
        v-if="menuOpen"
        :publish-item="publishItem"
        @edit="$emit('edit')"
        @publish="$emit('publish')"
        @rename="$emit('rename')"
        @delete="$emit('delete')"
        @close="closeMenu"
      />
    </template>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SText } from '@stylebot/components';
import { CheckIcon, MoreIcon } from '@stylebot/icons';

import ProfileMenu from './ProfileMenu.vue';
import type { GalleryMenuItem } from '@stylebot/gallery';

/**
 * One row of the popup's profile list: No style, or a profile with a •••
 * for its own actions, whose name turns into a field while it's renamed.
 */
export default Vue.extend({
  name: 'ProfileRow',

  components: {
    SText,
    CheckIcon,
    MoreIcon,
    ProfileMenu,
  },

  props: {
    name: {
      type: String,
      required: true,
    },

    checked: Boolean,
    disabled: Boolean,
    menuOpen: Boolean,
    renaming: Boolean,

    // Whether the row has a ••• for its own actions.
    actions: {
      type: Boolean,
      default: true,
    },

    // The name being typed while renaming.
    value: {
      type: String,
      default: '',
    },

    error: {
      type: String,
      default: '',
    },

    publishItem: {
      type: Object as PropType<GalleryMenuItem | null>,
      default: null,
    },
  },

  watch: {
    async renaming(renaming: boolean): Promise<void> {
      if (!renaming) {
        return;
      }

      await this.$nextTick();

      const input = this.$refs.input as HTMLInputElement;

      input.focus();
      input.select();
    },
  },

  methods: {
    onInput(event: Event): void {
      this.$emit('input', (event.target as HTMLInputElement).value);
    },

    /**
     * Closes the menu and hands focus back to the ••• that opened it.
     */
    closeMenu(): void {
      this.$emit('close-menu');
      (this.$refs.more as HTMLElement | undefined)?.focus();
    },
  },
});
</script>

<style lang="scss" scoped>
.profile-row {
  position: relative;
  display: flex;
  align-items: center;
  height: 34px;
  border-radius: 7px;

  &:hover:not(.disabled),
  &:focus-within,
  &.menu-open {
    background: var(--hover-tint);
  }
}

.profile-option {
  @include button-reset;

  display: flex;
  flex: 1;
  align-items: center;
  gap: 12px;
  min-width: 0;
  height: 100%;
  padding: 0 10px;
  border-radius: 7px;
  cursor: pointer;

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
  width: 16px;
  color: var(--accent-text);

  .previewing & {
    color: var(--text-muted);
  }

  .profile-row:hover &,
  .profile-row:focus-within &,
  .menu-open & {
    opacity: 0;
  }

  .profile-row:not(:has(.row-more)) & {
    opacity: 1;
  }
}

.profile-name {
  @include truncate;

  flex: 1;
  min-width: 0;

  .checked & {
    font-weight: 600;
  }
}

.row-more {
  @include button-reset;

  position: absolute;
  top: 4px;
  right: 5px;
  display: flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  color: var(--text-muted);
  opacity: 0;
  cursor: pointer;

  .profile-row:hover &,
  .profile-row:focus-within &,
  .menu-open & {
    opacity: 1;
  }

  &:hover,
  .menu-open & {
    color: var(--text-primary);
  }

  @include focus-ring;
}

.name-input {
  flex: 1;
  width: 0;
  min-width: 0;
  height: 26px;
  margin-left: -6px;
  padding: 0 6px;
  border: none;
  border-radius: 6px;
  outline: none;
  font: inherit;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--field-surface);
  box-shadow: 0 0 0 1.5px var(--accent);

  &.invalid {
    box-shadow: 0 0 0 1.5px var(--danger);
  }
}
</style>
