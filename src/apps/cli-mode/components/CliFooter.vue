<template>
  <footer class="footer">
    <cli-status class="status" :agent="agent" />
    <span class="hints">
      <cli-key-hint v-if="!marked" shortcut="drag">
        {{ t('mark') }}
      </cli-key-hint>
      <cli-key-hint shortcut="/">{{ t('note') }}</cli-key-hint>
      <cli-key-hint v-if="canUndo" shortcut="z">
        {{ t('undo_lowercase') }}
      </cli-key-hint>
      <cli-key-hint v-if="marked" shortcut="x">{{ t('clear') }}</cli-key-hint>
      <cli-key-hint shortcut=".">{{ t('hide_lowercase') }}</cli-key-hint>
    </span>
  </footer>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { CliAgentStatus, CliThreadEntry } from '@stylebot/types';

import { lastUndoableSave, threadSteps } from '../thread';
import CliKeyHint from './CliKeyHint.vue';
import CliStatus from './CliStatus.vue';

/**
 * The open terminal's status line: the agent's status, and the shortcuts that
 * do something now. Hints drop from the end when there's no room.
 */
export default Vue.extend({
  name: 'CliFooter',

  components: { CliKeyHint, CliStatus },

  props: {
    agent: {
      type: String as PropType<CliAgentStatus>,
      required: true,
    },

    thread: {
      type: Array as PropType<Array<CliThreadEntry>>,
      required: true,
    },

    // There are areas marked on the page.
    marked: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    // A save `z` would undo.
    canUndo(): boolean {
      return !!lastUndoableSave(threadSteps(this.thread));
    },
  },
});
</script>

<style lang="scss" scoped>
.footer {
  display: flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 14px;
  border-top: 1px solid var(--term-border);
  background: var(--term-raised);
}

.status {
  flex: none;
}

.hints {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0 14px;
  min-width: 0;
  height: 18px;
  margin-left: 16px;
  overflow: hidden;
  color: var(--term-dim);
}
</style>
