<template>
  <div v-if="canUndo || canRedo" class="undo-redo">
    <s-icon-button
      :size="24"
      :tooltip="t('undo')"
      :tooltip-shortcut="shortcuts.undo"
      :disabled="!canUndo"
      @click="undo"
    >
      <undo-icon :size="16" />
    </s-icon-button>

    <s-icon-button
      :size="24"
      :tooltip="t('redo')"
      :tooltip-shortcut="shortcuts.redo"
      :disabled="!canRedo"
      @click="redo"
    >
      <redo-icon :size="16" />
    </s-icon-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SIconButton } from '@stylebot/components';
import { RedoIcon, UndoIcon } from '@stylebot/icons';
import { isMac } from '@stylebot/utils';

import { undoShortcuts } from '../../store/undo-stack';

export default Vue.extend({
  name: 'TheUndoRedo',

  components: {
    SIconButton,
    RedoIcon,
    UndoIcon,
  },

  computed: {
    canUndo(): boolean {
      return this.$store.getters.canUndo;
    },

    canRedo(): boolean {
      return this.$store.getters.canRedo;
    },

    shortcuts(): { undo: string; redo: string } {
      return undoShortcuts(isMac());
    },
  },

  methods: {
    undo(): void {
      this.$store.dispatch('undo');
    },

    redo(): void {
      this.$store.dispatch('redo');
    },
  },
});
</script>

<style lang="scss" scoped>
.undo-redo {
  display: flex;
  gap: 2px;
  margin-right: 4px;
}
</style>
