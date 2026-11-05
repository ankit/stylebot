<template>
  <component
    :is="href ? 'a' : 'button'"
    class="gallery-link"
    v-bind="linkAttrs"
    @click="$emit('click')"
  >
    <span class="label"><slot /></span>
    <s-text
      v-if="count !== null"
      as="span"
      size="large"
      variant="muted"
      class="count"
    >
      {{ count }}
      <chevron-right-icon :size="14" />
    </s-text>
  </component>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SText } from '@stylebot/components';
import { ChevronRightIcon } from '@stylebot/icons';

/**
 * A row leading to more of the gallery: out to `href` when it has one, or
 * else a button that emits `click`, with `count` styles waiting there.
 */
export default Vue.extend({
  name: 'GalleryLink',

  components: {
    ChevronRightIcon,
    SText,
  },

  props: {
    href: {
      type: String,
      default: '',
    },

    count: {
      type: Number as PropType<number | null>,
      default: null,
    },
  },

  computed: {
    linkAttrs(): Record<string, string> {
      return this.href
        ? { href: this.href, target: '_blank', rel: 'noopener noreferrer' }
        : { type: 'button' };
    },
  },
});
</script>

<style lang="scss" scoped>
.gallery-link {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: var(--popup-row-height, 36px);
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-align: start;
  text-decoration: none;
  cursor: pointer;

  @include hover-capable {
    &:hover {
      color: var(--text-primary);
      background: var(--hover-tint);
    }
  }

  @include focus-ring;
}

.label {
  @include truncate;

  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.45;
}

.count {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}
</style>
