<template>
  <div class="card">
    <div class="text">
      <heading as="h2" size="sm">{{ t('appearance') }}</heading>
      <text-block size="caption" class="description">{{ t('appearance_description') }}</text-block>
    </div>

    <div class="segmented">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="segment"
        :class="{ active: theme === option.value }"
        @click="theme = option.value"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { StylebotTheme } from '@stylebot/types';
import { Heading, TextBlock } from '@stylebot/components';

export default Vue.extend({
  name: 'TheAppearance',

  components: {
    Heading,
    TextBlock,
  },

  data(): { options: Array<{ value: StylebotTheme; label: string }> } {
    return {
      options: [
        { value: 'auto', label: this.t('theme_auto') },
        { value: 'light', label: this.t('theme_light') },
        { value: 'dark', label: this.t('theme_dark') },
      ],
    };
  },

  computed: {
    theme: {
      get(): StylebotTheme {
        return this.$store.state.options['theme'] ?? 'auto';
      },

      set(value: StylebotTheme): void {
        this.$store.dispatch('setOption', { name: 'theme', value });
      },
    },
  },
});
</script>

<style lang="scss" scoped>
.card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
}

.text {
  flex: 1;
  min-width: 0;
}

.description {
  margin-top: 2px;
}

.segmented {
  flex: none;
  display: flex;
  padding: 2px;
  border-radius: 9px;
  background: var(--ui-hover-bg);
}

.segment {
  all: unset;
  box-sizing: border-box;
  padding: 6px 12px;
  border-radius: 7px;
  font-weight: 500;
  font-size: 12.5px;
  line-height: 1.3;
  color: var(--ui-fg-muted);
  cursor: pointer;

  &:hover {
    color: var(--ui-fg);
  }

  &.active {
    background: var(--ui-bg);
    color: var(--ui-fg);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  &:focus-visible {
    outline: 2px solid var(--ui-focus-ring);
    outline-offset: 1px;
  }
}
</style>
