<template>
  <div class="cli-command">
    <code class="cli-command-text">
      <span class="cli-command-prompt" aria-hidden="true">$</span>
      {{ command }}
    </code>
    <s-button
      variant="ghost"
      size="small"
      class="cli-command-copy"
      @click="copy"
    >
      {{ copied ? t('copied') : t('copy') }}
    </s-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SButton } from '@stylebot/components';

const COPIED_FOR_MS = 1600;

/**
 * A shell command to paste in a terminal, with a button that copies it.
 */
export default Vue.extend({
  name: 'CliCommand',

  components: {
    SButton,
  },

  props: {
    command: {
      type: String,
      required: true,
    },
  },

  data(): { copied: boolean; timer: number | undefined } {
    return {
      copied: false,
      timer: undefined,
    };
  },

  beforeDestroy() {
    window.clearTimeout(this.timer);
  },

  methods: {
    async copy(): Promise<void> {
      try {
        await navigator.clipboard.writeText(this.command);
      } catch {
        return;
      }

      this.copied = true;
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(
        () => (this.copied = false),
        COPIED_FOR_MS
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.cli-command {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  max-width: 440px;
  height: 36px;
  padding: 0 4px 0 12px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--field-fill);
}

.cli-command-text {
  @include truncate;

  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
}

.cli-command-prompt {
  margin-right: 1ch;
  color: var(--text-faint);
  user-select: none;
}

.cli-command .cli-command-copy {
  flex: none;
  color: var(--text-muted);

  &:hover {
    color: var(--text-primary);
  }
}
</style>
