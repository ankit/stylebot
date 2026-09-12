<template>
  <div class="backdrop" @click.self="$emit('cancel')">
    <div
      ref="card"
      class="card"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <heading id="confirm-dialog-title" as="h2" size="md">{{ title }}</heading>
      <s-text id="confirm-dialog-message" size="caption" variant="muted" class="message">{{ message }}</s-text>

      <div class="actions">
        <s-button ref="cancelButton" variant="ghost" @click="$emit('cancel')">
          {{ cancelLabel }}
        </s-button>

        <s-button variant="danger" @click="$emit('confirm')">
          {{ confirmLabel }}
        </s-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading, SText, SButton } from '@stylebot/components';

export default Vue.extend({
  name: 'ConfirmDialog',

  components: {
    SButton,
    Heading,
    SText,
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

    this.previouslyFocused = this.activeElement();

    // Deferred a tick so it wins over the closing menu's own focus-restore,
    // which runs in the same reactivity flush and would otherwise steal it back.
    this.$nextTick(() => {
      const cancelButton = this.$refs.cancelButton as Vue | undefined;
      (cancelButton?.$el as HTMLElement | undefined)?.focus();
    });
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.onKeydown);

    // The trigger may have been removed from the DOM by the confirmed action.
    if (this.previouslyFocused?.isConnected) {
      this.previouslyFocused.focus();
    } else {
      document.body.focus();
    }
  },

  methods: {
    focusableElements(): Array<HTMLElement> {
      const card = this.$refs.card as HTMLElement;
      return Array.from(card.querySelectorAll<HTMLElement>('button, a[href], [tabindex]'));
    },

    activeElement(): HTMLElement | null {
      const root = this.$el.getRootNode();
      const active = root instanceof ShadowRoot ? root.activeElement : document.activeElement;
      return active instanceof HTMLElement ? active : null;
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
      const active = this.activeElement();

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
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
  background: var(--background);
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
