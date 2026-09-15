<template>
  <div class="basic-editor-actions">
    <s-button class="action-button hide-button" :class="{ active: isHidden }" :disabled="disabled" @click="toggleHidden">
      <eye-off-icon :size="12" />
      {{ t('hide') }}
    </s-button>

    <s-button class="action-button" :disabled="disabled" @click="reset">
      {{ t('reset') }}
    </s-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';
import { SButton } from '@stylebot/components';
import { EyeOffIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'TheBasicEditorActions',

  components: {
    SButton,
    EyeOffIcon,
  },

  computed: {
    isHidden(): boolean {
      const activeRule = this.$store.getters.activeRule;
      let value = '';

      if (activeRule) {
        activeRule.clone().walkDecls('display', (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value === 'none';
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
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

.action-button {
  gap: 4px;
  padding: 4px 9px;
  font-size: 11.5px;
}

.basic-editor-actions .action-button {
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
