<template>
  <header
    class="title-bar"
    :title="t('drag_to_move')"
    @pointerdown="$emit('drag', $event)"
  >
    <span class="title">
      stylebot
      <span class="dim">~ {{ t('cli_mode') }}</span>
    </span>
    <span class="buttons">
      <cli-window-button
        :title="t('label_with_key', [t('minimize'), '.'])"
        @click="$emit('minimize')"
      >
        <minus-icon :size="16" />
      </cli-window-button>
      <cli-window-button
        :title="t('turn_off_cli_mode')"
        @click="$emit('close')"
      >
        <x-icon :size="16" />
      </cli-window-button>
    </span>
  </header>
</template>

<script lang="ts">
import Vue from 'vue';
import { MinusIcon, XIcon } from '@stylebot/icons';

import CliWindowButton from './CliWindowButton.vue';

/**
 * The open terminal's title bar, which moves it. Emits `drag` with the
 * press, `minimize` and `close`.
 */
export default Vue.extend({
  name: 'CliTitleBar',

  components: { CliWindowButton, MinusIcon, XIcon },
});
</script>

<style lang="scss" scoped>
.title-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 6px 5px 14px;
  border-bottom: 1px solid var(--term-border);
  background: var(--term-raised);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.title {
  flex: 1;
  color: var(--term-bright);
  font-weight: 600;
}

.dim {
  color: var(--term-faint);
  font-weight: 400;
}

.buttons {
  display: flex;
  flex: none;
  margin-right: -2px;
}
</style>
