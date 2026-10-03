<template>
  <s-dialog @cancel="$emit('cancel')">
    <form @submit.prevent="submit">
      <s-dialog-card :title="title" role="dialog">
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

        <template #actions>
          <s-button variant="ghost" @click="$emit('cancel')">
            {{ cancelLabel }}
          </s-button>

          <s-button variant="primary" :disabled="!canSubmit" @click="submit">
            {{ confirmLabel }}
          </s-button>
        </template>
      </s-dialog-card>
    </form>
  </s-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import SText from './SText.vue';
import SButton from './SButton.vue';
import SDialog from './SDialog.vue';
import SDialogCard from './SDialogCard.vue';

export default Vue.extend({
  name: 'SPromptDialog',

  components: {
    SButton,
    SText,
    SDialog,
    SDialogCard,
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
</style>
