<template>
  <div class="username-field">
    <gallery-field
      :label="t('username')"
      :hint="tooltip ? '' : hint"
      :tooltip="tooltip ? hint : ''"
    >
      <s-text-input
        type="search"
        :value="username"
        :maxlength="maxLength"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        data-bwignore
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        @input.native="input"
        @keydown.native.esc.prevent
      />
    </gallery-field>

    <p v-if="message" class="status" :class="status" role="status">
      {{ message }}
      <s-link-button
        v-if="suggestion"
        @click="$emit('update:username', suggestion)"
      >
        {{ t('use_username', [suggestion]) }}
      </s-link-button>
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SLinkButton, STextInput } from '@stylebot/components';
import { isValidUsername, USERNAME_MAX_LENGTH } from '@stylebot/gallery';
import { debounce, type Debounced } from '@stylebot/utils';

import { checkGalleryUsername } from '../../utils/gallery';
import GalleryField from './GalleryField.vue';

type Status =
  | 'current'
  | 'checking'
  | 'available'
  | 'taken'
  | 'reserved'
  | 'invalid'
  | 'unchecked';

type Data = {
  status: Status;
  suggestion: string;
};

const CHECK_DELAY_MS = 300;

/**
 * The account's username, bound with `.sync` and lowercased as it's typed,
 * with whether the gallery has it free. Emits `update:unavailable` while
 * the typed one can't be taken.
 */
export default Vue.extend({
  name: 'UsernameField',

  components: {
    GalleryField,
    SLinkButton,
    STextInput,
  },

  props: {
    username: {
      type: String,
      required: true,
    },

    // The account's username now, which is always its own to keep.
    current: {
      type: String,
      required: true,
    },

    // The hint as a tooltip on the input instead, to save a line.
    tooltip: {
      type: Boolean,
      default: false,
    },
  },

  data(): Data & { check: Debounced<[string]> | null } {
    return {
      status: 'current',
      suggestion: '',
      check: null,
    };
  },

  computed: {
    hint(): string {
      return this.t(
        'it_shows_on_the_styles_you_publish_and_old_links_keep_working'
      );
    },

    maxLength(): number {
      return USERNAME_MAX_LENGTH;
    },

    message(): string {
      switch (this.status) {
        case 'available':
          return this.t('available');
        case 'taken':
          return this.t('that_username_is_taken');
        case 'reserved':
          return this.t('that_username_is_reserved');
        case 'invalid':
          return this.t(
            'use_3_to_30_lowercase_letters_and_numbers_with_single_hyphens_between_them'
          );
        default:
          return '';
      }
    },

    unavailable(): boolean {
      return ['taken', 'reserved', 'invalid'].includes(this.status);
    },
  },

  watch: {
    username: {
      immediate: true,
      handler(username: string): void {
        this.update(username);
      },
    },

    unavailable(unavailable: boolean): void {
      this.$emit('update:unavailable', unavailable);
    },
  },

  created() {
    this.check = debounce(this.runCheck, CHECK_DELAY_MS);
  },

  beforeDestroy() {
    this.check?.cancel();
  },

  methods: {
    /**
     * Lowercases the field in place, keeping the caret where it was.
     */
    input(event: Event): void {
      const field = event.target as HTMLInputElement;
      const lower = field.value.toLowerCase();

      if (lower !== field.value) {
        const { selectionStart, selectionEnd } = field;

        field.value = lower;
        field.setSelectionRange(selectionStart, selectionEnd);
      }

      this.$emit('update:username', lower);
    },

    update(username: string): void {
      this.check?.cancel();
      this.suggestion = '';

      if (username === this.current) {
        this.status = 'current';
      } else if (!isValidUsername(username)) {
        this.status = 'invalid';
      } else {
        this.status = 'checking';
        this.check?.(username);
      }
    },

    /**
     * Asks the gallery about a username, dropping the answer when another
     * has been typed meanwhile. A failed check doesn't block publishing,
     * which reports the gallery's own reason instead.
     */
    async runCheck(username: string): Promise<void> {
      const response = await checkGalleryUsername(username);

      if (username !== this.username) {
        return;
      }

      if (!response.ok) {
        this.status = 'unchecked';
      } else if (response.available) {
        this.status = 'available';
      } else {
        this.status = response.reason ?? 'taken';
        this.suggestion = response.suggestion ?? '';
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.username-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.status {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--danger);
}

.status.available {
  color: var(--success);
}
</style>
