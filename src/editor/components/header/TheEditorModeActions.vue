<template>
  <div class="mode-tabs" role="tablist">
    <button
      type="button"
      class="mode-tab"
      :class="{ active: mode === 'basic' }"
      :disabled="readability"
      role="tab"
      :aria-selected="mode === 'basic'"
      :title="`${t('basic_mode_description')} (b)`"
      @click="setMode('basic')"
    >
      {{ t('basic_mode') }}
    </button>

    <button
      type="button"
      class="mode-tab"
      :class="{ active: mode === 'code' }"
      :disabled="readability"
      role="tab"
      :aria-selected="mode === 'code'"
      :title="`${t('code_mode_description')} (c)`"
      @click="setMode('code')"
    >
      {{ t('code_mode') }}
    </button>

    <button
      type="button"
      class="mode-tab"
      :class="{ active: mode === 'magic' }"
      role="tab"
      :aria-selected="mode === 'magic'"
      :title="`${t('magic_mode_description')} (m)`"
      @click="setMode('magic')"
    >
      {{ t('magic_mode') }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheEditorModeActions',

  computed: {
    mode(): string {
      return this.$store.state.options.mode;
    },

    readability(): boolean {
      return this.$store.getters.readabilityActive;
    },
  },

  methods: {
    setMode(mode: string): void {
      this.$store.dispatch('setMode', mode);
    },
  },
});
</script>

<style lang="scss" scoped>
.mode-tabs {
  display: flex;
  gap: 20px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
}

.mode-tab {
  padding: 11px 0 10px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 400;
  color: var(--muted-foreground);
  cursor: pointer;
  box-shadow: inset 0 -2px 0 transparent;

  &:hover:not(:disabled):not(.active) {
    color: var(--foreground);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &.active {
    font-weight: 600;
    color: var(--foreground);
    box-shadow: inset 0 -2px 0 var(--primary);
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }
}
</style>
