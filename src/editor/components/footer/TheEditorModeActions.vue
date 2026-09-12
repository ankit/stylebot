<template>
  <div class="mode-actions" role="group">
    <button
      type="button"
      class="mode-action"
      :class="{ active: mode === 'basic' }"
      :disabled="readability"
      :title="`${t('basic_mode_description')} (b)`"
      @click="setMode('basic')"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
        <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
        <circle cx="5.2" cy="6" r="1.1" fill="currentColor" stroke="none" />
        <path d="M2 12.5l4-4 2.5 2.5L12 7l2 2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>{{ t('basic_mode') }}</span>
    </button>

    <button
      type="button"
      class="mode-action"
      :class="{ active: mode === 'code' }"
      :disabled="readability"
      :title="`${t('code_mode_description')} (c)`"
      @click="setMode('code')"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5.5 4L2 8l3.5 4M10.5 4L14 8l-3.5 4" />
      </svg>
      <span>{{ t('code_mode') }}</span>
    </button>

    <button
      type="button"
      class="mode-action"
      :class="{ active: mode === 'magic' }"
      :title="`${t('magic_mode_description')} (m)`"
      @click="setMode('magic')"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1.5l1.6 3.9 4.1.4-3.1 2.8.9 4-3.5-2.2-3.5 2.2.9-4-3.1-2.8 4.1-.4z" />
      </svg>
      <span>{{ t('magic_mode') }}</span>
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
.mode-actions {
  display: inline-flex;
  border: 1px solid var(--input);
  border-radius: 8px;
  overflow: hidden;
}

.mode-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-right: 1px solid var(--input);
  background: var(--background);
  color: var(--foreground);
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;

  &:last-child {
    border-right: none;
  }

  &:hover:not(:disabled):not(.active) {
    background: var(--accent);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &.active {
    background: var(--primary);
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }
}
</style>
