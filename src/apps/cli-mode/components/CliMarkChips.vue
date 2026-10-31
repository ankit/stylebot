<template>
  <div class="mark-chips">
    <ul v-if="marks.length" class="chips">
      <li
        v-for="mark in marks"
        :key="mark.n"
        class="chip"
        @mouseenter="$emit('highlight', mark.n)"
        @mouseleave="$emit('highlight', null)"
      >
        <span class="n">{{ mark.n }}</span>
        <span class="size">{{ formatSize(mark.area) }}</span>
        <button
          type="button"
          class="remove"
          :aria-label="t('remove_mark_n', [String(mark.n)])"
          :title="t('remove_mark_n', [String(mark.n)])"
          @click="$emit('unmark', mark.n)"
        >
          ×
        </button>
      </li>
    </ul>
    <p v-else class="hint"># {{ t('drag_on_the_page_to_mark_an_area') }}</p>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { formatSize } from '../areas';
import type { PageMark } from '../state';

/**
 * The areas marked on the page, as chips with their number and size.
 * Hovering one outlines its area. Emits `highlight` with a mark's number,
 * or null once the pointer leaves, and `unmark`.
 */
export default Vue.extend({
  name: 'CliMarkChips',

  props: {
    marks: {
      type: Array as PropType<Array<PageMark>>,
      required: true,
    },
  },

  methods: { formatSize },
});
</script>

<style lang="scss" scoped>
.mark-chips {
  padding: 8px 14px;
  border-top: 1px solid var(--term-border);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 1px 2px 1px 1px;
  border: 1px solid var(--term-border);
  border-radius: 4px;
  color: var(--term-dim);
  font-size: 12px;

  &:hover {
    border-color: var(--term-accent);
    color: var(--term-text);
  }
}

.n {
  flex: none;
  box-sizing: border-box;
  min-width: 18px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--term-accent);
  color: var(--term-bg);
  font-weight: 700;
  text-align: center;
}

.remove {
  @include button-reset;

  padding: 0 4px;
  border-radius: 3px;
  color: var(--term-faint);
  cursor: pointer;

  &:hover {
    color: var(--term-bright);
  }

  &:focus-visible {
    outline: 1px solid var(--term-accent);
    outline-offset: 0;
  }
}

.hint {
  margin: 0;
  color: var(--term-faint);
  font-size: 12px;
}
</style>
