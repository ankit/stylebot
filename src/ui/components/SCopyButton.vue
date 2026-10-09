<template>
  <s-icon-button
    class="copy-button"
    :size="size"
    :tooltip="copied ? t('copied') : t('copy')"
    @click="copy"
  >
    <check-icon v-if="copied" :size="14" />
    <copy-icon v-else :size="14" />
  </s-icon-button>
</template>

<script lang="ts">
import Vue from 'vue';

import { CheckIcon, CopyIcon } from '@stylebot/icons';

import SIconButton from './SIconButton.vue';

const COPIED_FOR_MS = 1600;

/**
 * An icon button that copies text to the clipboard, showing a check for a
 * moment once it has.
 */
export default Vue.extend({
  name: 'SCopyButton',

  components: {
    CheckIcon,
    CopyIcon,
    SIconButton,
  },

  props: {
    text: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      default: 28,
    },
  },

  data(): { copied: boolean; timer: number | undefined } {
    return {
      copied: false,
      timer: undefined,
    };
  },

  watch: {
    text(): void {
      this.copied = false;
    },
  },

  beforeDestroy() {
    window.clearTimeout(this.timer);
  },

  methods: {
    async copy(): Promise<void> {
      try {
        await navigator.clipboard.writeText(this.text);
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
.copy-button {
  color: var(--text-muted);

  &:hover {
    color: var(--text-primary);
  }
}
</style>
