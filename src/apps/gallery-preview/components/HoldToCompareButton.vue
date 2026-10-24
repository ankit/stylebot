<template>
  <s-button
    class="compare"
    :class="{ held }"
    :disabled="disabled"
    aria-keyshortcuts="C"
    @pointerdown.native="hold($event)"
    @pointerup.native="release"
    @pointercancel.native="release"
    @lostpointercapture.native="release"
    @blur.native="release"
    @keydown.native.space.prevent="setHeld(true)"
    @keydown.native.enter.prevent="setHeld(true)"
    @keyup.native="release"
  >
    <span class="labels">
      <span :class="{ hidden: held }">{{ t('hold_to_compare') }}</span>
      <span :class="{ hidden: !held }" aria-hidden="true">
        {{ t('original') }}
      </span>
    </span>
    <s-shortcut-chip small value="c" class="key" aria-hidden="true" />
  </s-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, SShortcutChip } from '@stylebot/components';

const KEY = 'KeyC';

/**
 * Whether a key press belongs to something the user is typing in.
 */
const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * Whether a key press is the bare compare key, outside anything typed in.
 */
const isCompareKey = (event: KeyboardEvent): boolean =>
  event.code === KEY &&
  event.isTrusted &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.shiftKey &&
  !isTyping(event.target);

/**
 * A button held down by pointer, Space or Enter, or C anywhere on the page,
 * emitting `change` as it's held and let go.
 */
export default Vue.extend({
  name: 'HoldToCompareButton',

  components: {
    SButton,
    SShortcutChip,
  },

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      held: false,
    };
  },

  mounted() {
    // Captured, so the page's own shortcut for C doesn't run as well.
    window.addEventListener('keydown', this.onKeydown, true);
    window.addEventListener('keyup', this.onKeyup, true);
    window.addEventListener('blur', this.release);
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown, true);
    window.removeEventListener('keyup', this.onKeyup, true);
    window.removeEventListener('blur', this.release);
    this.setHeld(false);
  },

  methods: {
    setHeld(held: boolean): void {
      if (this.held !== held) {
        this.held = held;
        this.$emit('change', held);
      }
    },

    hold(event: PointerEvent): void {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.setHeld(true);
    },

    release(): void {
      this.setHeld(false);
    },

    onKeydown(event: KeyboardEvent): void {
      if (this.disabled || !isCompareKey(event)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      this.setHeld(true);
    },

    onKeyup(event: KeyboardEvent): void {
      if (event.code === KEY && this.held) {
        event.stopImmediatePropagation();
        this.release();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.compare {
  touch-action: none;
  user-select: none;

  .key.chip {
    margin: -2px 0;
    padding: 2px 5px;
    border-radius: 4px;

    ::v-deep kbd {
      font-size: 10px;
    }
  }
}

// No keyboard to press it on.
@media (pointer: coarse) {
  .key {
    display: none;
  }
}

.labels {
  display: grid;

  > * {
    grid-area: 1 / 1;
  }
}

.hidden {
  visibility: hidden;
}

.button.compare.held,
.button.compare.held:hover:not(:disabled) {
  border-color: var(--text-primary);
  background: var(--text-primary);
  color: var(--panel-surface);
}
</style>
