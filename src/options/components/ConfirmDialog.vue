<template>
  <div class="backdrop" @click.self="$emit('cancel')">
    <div
      ref="card"
      class="card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <heading id="confirm-dialog-title" as="h2" size="md">{{ title }}</heading>
      <text-block id="confirm-dialog-message" size="caption" class="message">{{ message }}</text-block>

      <div class="actions">
        <app-button ref="cancelButton" variant="ghost" @click="$emit('cancel')">
          {{ cancelLabel }}
        </app-button>

        <app-button variant="danger" @click="$emit('confirm')">
          {{ confirmLabel }}
        </app-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading, TextBlock } from '@stylebot/components';

import AppButton from './AppButton.vue';

export default Vue.extend({
  name: 'ConfirmDialog',

  components: {
    AppButton,
    Heading,
    TextBlock,
  },

  props: {
    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    confirmLabel: {
      type: String,
      default: 'Delete',
    },

    cancelLabel: {
      type: String,
      default: 'Cancel',
    },
  },

  data(): { previouslyFocused: HTMLElement | null } {
    return {
      // So focus returns to whatever opened the dialog (e.g. a menu item)
      // once it closes, instead of falling back to <body>.
      previouslyFocused: null,
    };
  },

  mounted() {
    document.addEventListener('keydown', this.onKeydown);

    this.previouslyFocused = document.activeElement as HTMLElement | null;

    const cancelButton = this.$refs.cancelButton as Vue | undefined;
    (cancelButton?.$el as HTMLElement | undefined)?.focus();
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.onKeydown);
    this.previouslyFocused?.focus();
  },

  methods: {
    focusableElements(): Array<HTMLElement> {
      const card = this.$refs.card as HTMLElement;
      return Array.from(card.querySelectorAll<HTMLElement>('button, a[href], [tabindex]'));
    },

    onKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        this.$emit('cancel');
        return;
      }

      // Traps Tab within the dialog — without this, Tab walks out into the
      // (still-present) page behind the backdrop.
      if (event.key !== 'Tab') {
        return;
      }

      const focusable = this.focusableElements();
      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.card {
  width: 360px;
  max-width: calc(100vw - 32px);
  background: var(--ui-bg);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
  padding: 20px;
}

.message {
  margin: 8px 0 20px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
