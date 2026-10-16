<template>
  <s-button v-if="label" size="small" class="labelled" @click="copy">
    <check-icon v-if="copied" :size="13" />
    <copy-icon v-else :size="13" />
    <span class="labels">
      <span :class="{ hidden: copied }">{{ label }}</span>
      <span :class="{ hidden: !copied }">{{ t('copied') }}</span>
    </span>
  </s-button>
  <s-icon-button
    v-else
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

import SButton from './SButton.vue';
import SIconButton from './SIconButton.vue';

const COPIED_FOR_MS = 1600;

/**
 * A button that copies text to the clipboard, showing a check for a moment
 * once it has: an icon alone, or with a label that turns to Copied. Both
 * labels take up room, so the button keeps its width.
 */
export default Vue.extend({
  name: 'SCopyButton',

  components: {
    CheckIcon,
    CopyIcon,
    SButton,
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

    label: {
      type: String,
      default: '',
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

.labelled.button.size-small {
  gap: 4px;
  padding: 6px 7px;
}

.labels {
  display: grid;

  > span {
    grid-area: 1 / 1;
  }
}

.hidden {
  visibility: hidden;
}
</style>
