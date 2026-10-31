<template>
  <div class="composer">
    <cli-mark-chips
      :marks="marks"
      @highlight="$emit('highlight', $event)"
      @unmark="$emit('unmark', $event)"
    />
    <cli-note-field ref="note" :marks="marks" @note="$emit('note', $event)" />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import type { PageMark } from '../state';
import CliMarkChips from './CliMarkChips.vue';
import CliNoteField from './CliNoteField.vue';

/**
 * Where the user writes to their agent: the marked areas as chips, and the
 * note field. Emits `highlight`, `unmark` and `note`.
 */
export default Vue.extend({
  name: 'CliComposer',

  components: { CliMarkChips, CliNoteField },

  props: {
    marks: {
      type: Array as PropType<Array<PageMark>>,
      required: true,
    },
  },

  methods: {
    /**
     * Puts the keyboard in the note field.
     */
    focus(): void {
      (this.$refs.note as Vue & { focus: () => void }).focus();
    },
  },
});
</script>

<style lang="scss" scoped>
.composer {
  border-top: 1px solid var(--term-border);
}
</style>
