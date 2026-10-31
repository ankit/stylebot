<template>
  <div class="pill">
    <cli-status
      class="handle"
      :agent="agent"
      :activity="activity"
      :thinking="thinking"
      short
      :title="t('drag_to_move')"
      @pointerdown.native="$emit('drag', $event)"
    />
    <button type="button" class="open" @click="$emit('open')">
      {{
        unseen
          ? t(unseen === 1 ? 'new_count_one' : 'new_count_other', [
              String(unseen),
            ])
          : t('open_bracketed')
      }}
    </button>
    <cli-window-button :title="t('turn_off_cli_mode')" @click="$emit('close')">
      <x-icon :size="16" />
    </cli-window-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { XIcon } from '@stylebot/icons';
import type { CliAgentStatus } from '@stylebot/types';

import CliStatus from './CliStatus.vue';
import CliWindowButton from './CliWindowButton.vue';

/**
 * The collapsed terminal: the agent's status, which moves it, and a button
 * that opens it, counting replies and saves since it was last open. Emits `drag`
 * with the press, `open` and `close`.
 */
export default Vue.extend({
  name: 'CliPill',

  components: { CliStatus, CliWindowButton, XIcon },

  props: {
    agent: {
      type: String as PropType<CliAgentStatus>,
      required: true,
    },

    activity: {
      type: String as PropType<string | null>,
      default: null,
    },

    thinking: {
      type: Boolean,
      default: false,
    },

    unseen: {
      type: Number,
      default: 0,
    },
  },
});
</script>

<style lang="scss" scoped>
.pill {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
}

.handle {
  flex: 0 1 auto;
  max-width: 260px;
  padding: 0 8px 0 6px;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.open {
  flex: none;
  margin: 0;
  padding: 2px 6px;
  border: 0;
  border-radius: 5px;
  background: none;
  color: var(--term-text);
  font: inherit;
  appearance: none;
  cursor: pointer;

  &:hover {
    background: var(--term-raised);
    color: var(--term-bright);
  }

  &:focus-visible {
    outline: 1px solid var(--term-accent);
    outline-offset: 0;
  }
}
</style>
