<template>
  <s-dialog @cancel="$emit('cancel')">
    <div
      class="card"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <heading id="confirm-dialog-title" as="h2" size="md">{{ title }}</heading>
      <s-text id="confirm-dialog-message" size="caption" variant="muted" class="message">{{ message }}</s-text>

      <div class="actions">
        <s-button variant="ghost" @click="$emit('cancel')">
          {{ cancelLabel }}
        </s-button>

        <s-button variant="danger" @click="$emit('confirm')">
          {{ confirmLabel }}
        </s-button>
      </div>
    </div>
  </s-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading, SText, SButton, SDialog } from '@stylebot/components';

export default Vue.extend({
  name: 'ConfirmDialog',

  components: {
    SButton,
    Heading,
    SText,
    SDialog,
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
});
</script>

<style lang="scss" scoped>
.card {
  width: 360px;
  max-width: calc(100vw - 32px);
  background: var(--panel-surface);
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
