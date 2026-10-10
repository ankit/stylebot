<template>
  <component
    :is="as"
    class="list-item"
    :class="{ interactive, compact, muted, padded, 'has-icon': hasIcon }"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <span v-if="hasIcon" class="icon"><slot name="icon" /></span>

    <span class="text">
      <span v-if="$slots.title" class="title"><slot name="title" /></span>
      <span v-if="$slots.meta" class="meta"><slot name="meta" /></span>
    </span>

    <span v-if="$slots.trailing" class="trailing">
      <slot name="trailing" />
    </span>
  </component>
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * One item of an SList: an icon, a title over a quiet meta line, and
 * controls at the end. Rendered as a button when the whole row is one
 * action, or a div when it holds controls of its own.
 */
export default Vue.extend({
  name: 'SListItem',

  inheritAttrs: false,

  props: {
    as: {
      type: String,
      default: 'div',
    },
    // Hover, pointer and focus ring, for a row that does something when
    // clicked.
    interactive: {
      type: Boolean,
      default: false,
    },
    // A shorter row with no icon, for a list whose rows share one subject.
    compact: {
      type: Boolean,
      default: false,
    },
    // Even padding on every side, for an item whose text may wrap, such as
    // a setting with a description.
    padded: {
      type: Boolean,
      default: false,
    },
    // Faded, for something that is switched off.
    muted: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    hasIcon(): boolean {
      return Boolean(this.$slots.icon) && !this.compact;
    },
  },
});
</script>

<style lang="scss" scoped>
.list-item {
  @include button-reset;

  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  box-sizing: border-box;
  width: 100%;
  min-height: 64px;
  padding: 0 20px;
  text-align: start;
}

.has-icon {
  grid-template-columns: 28px minmax(0, 1fr) auto;
}

.compact {
  min-height: 48px;
}

.padded {
  padding: 20px;
}

.padded .title {
  overflow: visible;
  white-space: normal;
  text-overflow: clip;
}

.interactive {
  cursor: pointer;

  &:hover {
    background: var(--card-surface);
  }

  @include focus-ring;
}

.icon {
  display: flex;
}

.muted .icon {
  opacity: 0.4;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.title {
  @include truncate;

  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--text-primary);

  @include dark-mode {
    color: color-mix(in srgb, var(--text-primary) 85%, var(--panel-surface));
  }
}

.muted .title {
  color: var(--text-muted);
}

.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.trailing {
  display: flex;
  align-items: center;
  gap: 14px;
}
</style>
