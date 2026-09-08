<template>
  <button
    ref="control"
    type="button"
    class="keycap"
    :class="{ recording }"
    aria-haspopup="true"
    @click="$emit('click')"
    @mouseenter="$emit('hover', $event)"
    @mouseleave="$emit('unhover')"
  >
    <icon-keyboard class="icon" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

import IconKeyboard from '../icons/IconKeyboard.vue';

export default Vue.extend({
  name: 'ShortcutKeycap',

  components: {
    IconKeyboard,
  },

  props: {
    recording: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.keycap {
  all: unset;
  box-sizing: border-box;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  cursor: pointer;
  color: var(--muted-foreground);
  transition: color 0.18s ease, background-color 0.18s ease;

  .icon {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--main-foreground);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--link-color);
  }

  &.recording {
    color: var(--main-foreground);
    background: var(--main-background);
    box-shadow: 0 0 0 2px var(--link-color);
  }
}
</style>
