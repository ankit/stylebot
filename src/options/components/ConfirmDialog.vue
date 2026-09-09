<template>
  <div class="backdrop" @click.self="$emit('cancel')">
    <div class="card">
      <heading as="h2" size="md">{{ title }}</heading>
      <text-block size="caption" class="message">{{ message }}</text-block>

      <div class="actions">
        <app-button variant="ghost" @click="$emit('cancel')">
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

  mounted() {
    document.addEventListener('keydown', this.onKeydown);
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.onKeydown);
  },

  methods: {
    onKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        this.$emit('cancel');
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
