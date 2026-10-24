<template>
  <div v-if="editing" class="create-profile editing">
    <profile-name-input
      v-model="draft"
      :error="error"
      cancel-on-blur
      @submit="submit"
      @cancel="editing = false"
    />
  </div>

  <button v-else type="button" class="create-profile" @click="start">
    <span class="create-profile-label">{{ t('create_profile') }}</span>
  </button>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { freeProfileName, isProfileNameTaken } from '@stylebot/saved-styles';

import ProfileNameInput from './ProfileNameInput.vue';

/**
 * Create profile, which swaps its label for a name field prefilled with the
 * next free name. Enter emits the name; Escape or leaving the field cancels.
 */
export default Vue.extend({
  name: 'CreateProfile',

  components: {
    ProfileNameInput,
  },

  props: {
    // The site's profile names as shown, which the new one can't repeat.
    names: {
      type: Array as PropType<Array<string>>,
      required: true,
    },
  },

  data(): { editing: boolean; draft: string } {
    return {
      editing: false,
      draft: '',
    };
  },

  computed: {
    error(): string {
      return isProfileNameTaken(this.draft, this.names)
        ? this.t('profile_name_taken')
        : '';
    },
  },

  methods: {
    start(): void {
      this.draft = freeProfileName(this.t('untitled'), this.names);
      this.editing = true;
    },

    submit(): void {
      const name = this.draft.trim();

      if (!name || this.error) {
        return;
      }

      this.editing = false;
      this.$emit('create', name);
    },
  },
});
</script>

<style lang="scss" scoped>
.create-profile {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border-radius: 7px;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover:not(.editing) {
    color: var(--text-primary);
    background: var(--hover-tint);
  }

  &.editing {
    cursor: default;
  }

  @include focus-ring;
}

.create-profile-label {
  @include truncate;

  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.45;
}
</style>
