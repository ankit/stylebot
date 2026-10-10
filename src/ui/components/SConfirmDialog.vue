<template>
  <s-dialog :contained="contained" @cancel="$emit('cancel')">
    <s-dialog-card
      :title="title"
      :contained="contained"
      role="alertdialog"
      aria-describedby="confirm-dialog-message"
    >
      <p id="confirm-dialog-message" class="message">{{ message }}</p>

      <template #actions>
        <s-button @click="$emit('cancel')">
          {{ cancelLabel }}
        </s-button>

        <s-button variant="danger" @click="$emit('confirm')">
          {{ confirmLabel }}
        </s-button>
      </template>
    </s-dialog-card>
  </s-dialog>
</template>

<script lang="ts">
import Vue from 'vue';

import SButton from './SButton.vue';
import SDialog from './SDialog.vue';
import SDialogCard from './SDialogCard.vue';

export default Vue.extend({
  name: 'SConfirmDialog',

  components: {
    SButton,
    SDialog,
    SDialogCard,
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

    contained: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.message {
  margin: 8px 0 24px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
  text-wrap: pretty;
}
</style>
