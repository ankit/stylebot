<template>
  <div class="basic-editor-actions">
    <s-tooltip :text="hideTooltipText" :shortcut="editorCommands.hide">
      <s-button
        size="small"
        class="action-button hide-button"
        :class="{ active: isHidden }"
        :disabled="disabled"
        @click="toggleHidden"
      >
        <eye-off-icon :size="12" />
        {{ t('hide') }}
      </s-button>
    </s-tooltip>

    <s-tooltip :text="t('reset_style_description')">
      <s-button
        size="small"
        class="action-button"
        :disabled="resetDisabled"
        @click="reset"
      >
        {{ t('reset') }}
      </s-button>
    </s-tooltip>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, STooltip } from '@stylebot/components';
import { getDeclarationValue } from '@stylebot/css';
import { EyeOffIcon } from '@stylebot/icons';
import type { StylebotEditorCommands } from '@stylebot/types';

export default Vue.extend({
  name: 'TheBasicEditorActions',

  components: {
    SButton,
    STooltip,
    EyeOffIcon,
  },

  computed: {
    isHidden(): boolean {
      return (
        getDeclarationValue(this.$store.getters.activeRule, 'display') ===
        'none'
      );
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },

    // Nothing to reset until the active selector actually has a rule.
    resetDisabled(): boolean {
      return this.disabled || !this.$store.getters.activeRule;
    },

    editorCommands(): StylebotEditorCommands {
      return this.$store.state.editorCommands;
    },

    hideTooltipText(): string {
      return this.isHidden
        ? this.t('show_selected_element')
        : this.t('hide_selected_element');
    },
  },

  methods: {
    toggleHidden(): void {
      this.$store.dispatch('applyDeclaration', {
        property: 'display',
        value: this.isHidden ? '' : 'none',
      });
    },

    reset(): void {
      this.$store.dispatch('resetActiveRule');
    },
  },
});
</script>

<style lang="scss" scoped>
.basic-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.basic-editor-actions .action-button {
  gap: 4px;
  padding: 8px;
  color: var(--text-muted);
}

.hide-button.active {
  color: var(--accent-ink);
  background: var(--accent);
  border-color: var(--accent);

  &:hover:not(:disabled) {
    background: var(--accent);
  }
}
</style>
