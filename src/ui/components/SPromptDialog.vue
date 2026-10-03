<template>
  <s-dialog @cancel="$emit('cancel')">
    <form
      class="card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-dialog-title"
      @submit.prevent="submit"
    >
      <s-heading id="prompt-dialog-title" as="h2" size="md">
        {{ title }}
      </s-heading>

      <input
        ref="input"
        v-model="text"
        class="prompt-input"
        tabindex="0"
        :aria-label="label"
        :placeholder="label"
        :aria-invalid="!!error"
        aria-describedby="prompt-dialog-error"
      />

      <s-text
        id="prompt-dialog-error"
        size="caption"
        variant="muted"
        class="error"
        role="alert"
      >
        {{ error }}
      </s-text>

      <div class="actions">
        <s-button variant="ghost" @click="$emit('cancel')">
          {{ cancelLabel }}
        </s-button>

        <s-button variant="primary" :disabled="!canSubmit" @click="submit">
          {{ confirmLabel }}
        </s-button>
      </div>
    </form>
  </s-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import SHeading from './SHeading.vue';
import SText from './SText.vue';
import SButton from './SButton.vue';
import SDialog from './SDialog.vue';

export default Vue.extend({
  name: 'SPromptDialog',

  components: {
    SButton,
    SHeading,
    SText,
    SDialog,
  },

  props: {
    title: {
      type: String,
      required: true,
    },

    label: {
      type: String,
      required: true,
    },

    value: {
      type: String,
      default: '',
    },

    confirmLabel: {
      type: String,
      required: true,
    },

    cancelLabel: {
      type: String,
      required: true,
    },

    // Returns an error message for text that can't be submitted, or ''.
    validate: {
      type: Function as PropType<(text: string) => string>,
      default: () => '',
    },
  },

  data(): { text: string } {
    return { text: this.value };
  },

  computed: {
    trimmed(): string {
      return this.text.trim();
    },

    error(): string {
      return this.trimmed ? this.validate(this.trimmed) : '';
    },

    canSubmit(): boolean {
      return !!this.trimmed && !this.error;
    },
  },

  mounted() {
    // SDialog focuses its first control a tick after mounting; the field
    // has to win that, so it waits a tick longer.
    setTimeout(() => {
      const input = this.$refs.input as HTMLInputElement | undefined;
      input?.focus();
      input?.select();
    });
  },

  methods: {
    submit(): void {
      if (this.canSubmit) {
        this.$emit('confirm', this.trimmed);
      }
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

.prompt-input {
  box-sizing: border-box;
  width: 100%;
  margin: 14px 0 0;
  padding: 7px 10px;
  font: inherit;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  outline: none;
  @include field-border;

  &:focus {
    @include field-active-border;
  }
}

.error {
  min-height: 18px;
  margin: 4px 0 12px;
  color: var(--danger);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
