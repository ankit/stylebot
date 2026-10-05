<template>
  <div class="attachment" :class="[size, { warning }]">
    <span class="attachment-media"><slot name="media" /></span>
    <span class="attachment-copy">
      <s-tooltip
        :text="fullLabel"
        :disabled="!fullLabel"
        @mouseenter.native="measureTruncation"
      >
        <s-text
          ref="label"
          as="span"
          size="label"
          class="attachment-label"
          :class="{ mono }"
        >
          <slot />
        </s-text>
      </s-tooltip>
      <s-text
        v-if="$slots.meta"
        as="span"
        size="caption"
        variant="muted"
        class="attachment-meta"
      >
        <slot name="meta" />
      </s-text>
    </span>
    <s-tooltip
      v-if="removeLabel"
      class="attachment-remove-tooltip"
      :text="removeLabel"
    >
      <s-icon-button
        :size="22"
        class="attachment-remove"
        :aria-label="removeLabel"
        @click="$emit('remove')"
      >
        <x-icon :size="12" />
      </s-icon-button>
    </s-tooltip>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import { XIcon } from '@stylebot/icons';

import SIconButton from './SIconButton.vue';
import SText from './SText.vue';
import STooltip from './STooltip.vue';

/**
 * Something going out with a message: a square `media` slot, a label with
 * an optional `meta` line under it, and, given a `removeLabel`, a remove
 * button that emits `remove`. A label cut short shows in full in a tooltip.
 */
export default Vue.extend({
  name: 'SAttachment',

  components: {
    SIconButton,
    SText,
    STooltip,
    XIcon,
  },

  props: {
    removeLabel: {
      type: String,
      default: '',
    },

    size: {
      type: String as PropType<'default' | 'small'>,
      default: 'default',
    },

    mono: Boolean,

    warning: Boolean,
  },

  data(): { fullLabel: string } {
    return { fullLabel: '' };
  },

  methods: {
    /**
     * Gives the tooltip the label's text only while it's cut short, as
     * the pointer arrives.
     */
    measureTruncation(): void {
      const label = (this.$refs.label as Vue).$el as HTMLElement;
      const truncated = label.scrollWidth > label.clientWidth;

      this.fullLabel = truncated ? (label.textContent ?? '').trim() : '';
    },
  },
});
</script>

<style lang="scss" scoped>
.attachment {
  display: flex;
  align-items: center;
  gap: 9px;
  box-sizing: border-box;
  min-width: 0;
  max-width: min(100%, 280px);
  padding: 4px;
  border-radius: 9px;
  background: var(--active);

  &.small {
    gap: 6px;
    padding: 3px 8px 3px 3px;
    border-radius: 8px;
  }
}

.attachment-media {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--field-border);
  border-radius: 6px;
  background: var(--panel-surface);
  color: var(--accent-text);

  .small & {
    min-width: 22px;
    height: 22px;
    border-radius: 5px;
  }

  .warning & {
    border-color: var(--warning-border);
    background: var(--warning-background);
    color: var(--warning);
  }
}

.attachment-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 2px;
}

.attachment .attachment-label {
  @include truncate;

  &.mono {
    font-family: var(--font-mono);
    font-size: 12px;
  }
}

.attachment.small .attachment-label.mono {
  font-size: 11px;
}

.attachment .attachment-meta {
  @include truncate;
}

.attachment.warning .attachment-meta {
  color: var(--warning);
}

.attachment-remove-tooltip {
  flex: none;
}

.attachment-remove {
  color: var(--icon-color);
}
</style>
