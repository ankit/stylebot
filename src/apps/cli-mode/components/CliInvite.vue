<template>
  <div class="invite">
    <span
      class="handle"
      :title="t('drag_to_move')"
      @pointerdown="$emit('drag', $event)"
    >
      <span class="dot">●</span>
      <span class="invite-text">
        {{
          connectedTo ? t('agent_on_host', [connectedTo]) : t('agent_waiting')
        }}
      </span>
    </span>
    <button
      type="button"
      class="connect"
      :title="t('connect_this_tab_to_your_agent')"
      @click="$emit('connect')"
    >
      {{ t(connectedTo ? 'move_here_bracketed' : 'connect_bracketed') }}
    </button>
    <cli-window-button
      :title="t('hide_on_this_page')"
      @click="$emit('dismiss')"
    >
      <x-icon :size="14" />
    </cli-window-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { XIcon } from '@stylebot/icons';

import CliWindowButton from './CliWindowButton.vue';

/**
 * Invites the user to connect this tab to an agent waiting for one, or to
 * move CLI mode here from the tab connected now. Emits `drag` with the
 * press, `connect` and `dismiss`.
 */
export default Vue.extend({
  name: 'CliInvite',

  components: { CliWindowButton, XIcon },

  props: {
    // The host of the tab connected now, if any.
    connectedTo: {
      type: String as PropType<string | null>,
      default: null,
    },
  },
});
</script>

<style lang="scss" scoped>
.invite {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
}

.handle {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 260px;
  padding: 0 8px 0 6px;
  color: var(--term-dim);
  font-size: 12px;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.dot {
  flex: none;
  color: var(--term-accent);
  font-size: 10px;
}

.invite-text {
  @include truncate;

  min-width: 0;
}

.connect {
  @include button-reset;

  flex: none;
  padding: 2px 6px;
  border-radius: 5px;
  color: var(--term-accent);
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
