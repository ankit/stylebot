<template>
  <textarea
    ref="input"
    class="chat-input"
    rows="2"
    :value="value"
    :placeholder="t('describe_a_change')"
    :aria-label="t('describe_a_change')"
    spellcheck="false"
    autocomplete="off"
    autocorrect="off"
    data-1p-ignore
    data-bwignore
    data-lpignore="true"
    data-form-type="other"
    @input="$emit('input', $event.target.value)"
    @keydown.enter.exact="onEnter"
  />
</template>

<script lang="ts">
import Vue from 'vue';

const MAX_HEIGHT = 160;

/**
 * The message field: grows with its text, and Enter submits while
 * Shift+Enter starts a new line.
 */
export default Vue.extend({
  name: 'ChatInput',

  props: {
    value: {
      type: String,
      required: true,
    },
  },

  watch: {
    value(): void {
      this.$nextTick(this.resize);
    },
  },

  mounted() {
    this.focus();
  },

  methods: {
    focus(): void {
      (this.$refs.input as HTMLTextAreaElement).focus();
    },

    resize(): void {
      const input = this.$refs.input as HTMLTextAreaElement;
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, MAX_HEIGHT)}px`;
    },

    onEnter(event: KeyboardEvent): void {
      // Enter also confirms an IME composition (Japanese, Chinese, …).
      if (event.isComposing) {
        return;
      }

      event.preventDefault();
      this.$emit('submit');
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-input {
  padding: 0;
  border: 0;
  outline: 0;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-body);
  background: transparent;

  &::placeholder {
    color: var(--text-faint);
  }
}
</style>
