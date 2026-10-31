<template>
  <label class="note-field">
    <span class="sigil">›</span>
    <textarea
      ref="field"
      v-model="draft"
      class="field"
      rows="1"
      :aria-label="t('note_to_your_agent')"
      :placeholder="placeholder"
      @input="fit"
      @keydown="onKeydown"
      @keyup.stop
      @keypress.stop
    ></textarea>
    <span v-if="draft.trim()" class="enter" aria-hidden="true">⏎</span>
  </label>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import type { PageMark } from '../state';

const MAX_HEIGHT = 120;

/**
 * Where the user writes a note to the agent about the marks on the page,
 * as a terminal prompt. Enter sends, Shift+Enter starts a new line, Esc
 * hands the keyboard back to the page. Keys typed here stay here. Emits
 * `note` with the text.
 */
export default Vue.extend({
  name: 'CliNoteField',

  props: {
    marks: {
      type: Array as PropType<Array<PageMark>>,
      required: true,
    },
  },

  data() {
    return { draft: '' };
  },

  computed: {
    placeholder(): string {
      if (!this.marks.length) {
        return this.t('tell_your_agent_what_to_change');
      }

      return this.t('what_should_change_about_marks', [
        this.marks.map(({ n }) => n).join(', '),
      ]);
    },
  },

  methods: {
    focus(): void {
      (this.$refs.field as HTMLTextAreaElement | undefined)?.focus();
    },

    fit(): void {
      const field = this.$refs.field as HTMLTextAreaElement;

      field.style.height = 'auto';
      field.style.height = `${Math.min(field.scrollHeight, MAX_HEIGHT)}px`;
    },

    onKeydown(event: KeyboardEvent): void {
      event.stopPropagation();

      if (event.key === 'Escape') {
        (event.target as HTMLElement).blur();
      } else if (
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.isComposing
      ) {
        event.preventDefault();
        this.send();
      }
    },

    async send(): Promise<void> {
      const text = this.draft.trim();

      if (!text) {
        return;
      }

      this.$emit('note', text);
      this.draft = '';
      await this.$nextTick();
      this.fit();
    },
  },
});
</script>

<style lang="scss" scoped>
.note-field {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 14px;
  cursor: text;
}

.sigil {
  flex: none;
  width: var(--term-gutter);
  text-align: center;
  color: var(--term-accent);
  font-weight: 600;
}

.field {
  flex: 1;
  min-width: 0;
  max-height: 120px;
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: none;
  caret-color: var(--term-accent);
  color: var(--term-bright);
  font: inherit;
  resize: none;

  &::placeholder {
    color: var(--term-faint);
  }
}

.enter {
  flex: none;
  color: var(--term-faint);
}
</style>
