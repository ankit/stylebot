<template>
  <div v-if="marks.length" class="mark-chips">
    <ul class="chips">
      <li
        v-for="mark in marks"
        :key="mark.n"
        class="chip"
        @mouseenter="$emit('highlight', mark.n)"
        @mouseleave="$emit('highlight', null)"
      >
        <cli-mark-number :n="mark.n" />
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
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { formatSize } from '../areas';
import type { PageMark } from '../state';
import CliMarkNumber from './CliMarkNumber.vue';

/**
 * The areas marked on the page, as chips with their number and size.
 * Hovering one outlines its area. Emits `highlight` with a mark's number,
 * or null once the pointer leaves, and `unmark`.
 */
export default Vue.extend({
  name: 'CliMarkChips',

  components: { CliMarkNumber },

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
  padding: 8px 14px 0;
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

.remove {
  @include button-reset;

  padding: 0 4px;
  border-radius: 3px;
  color: var(--term-faint);
  font-size: 16px;
  line-height: 18px;
  cursor: pointer;

  &:hover {
    color: var(--term-bright);
  }

  &:focus-visible {
    outline: 1px solid var(--term-accent);
    outline-offset: 0;
  }
}
</style>
