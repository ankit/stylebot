<template>
  <div ref="root" class="menu-root" tabindex="-1" @keydown="onKeydown" @keyup="onKeyup">
    <menu-box dense :min-width="232">
      <div v-if="recording" class="content">
        <div class="capture-row">
          <span class="capture-field">
            <shortcut-kbd v-if="liveModifiers" :value="liveModifiers" />
            <span class="placeholder">_</span>
          </span>
          <button type="button" class="cancel" @click="cancelRecording">Cancel</button>
        </div>
        <p class="helper">
          Press a key to finish · Esc
          <template v-if="hasValue">
            keeps <span class="chip chip-inline"><shortcut-kbd :value="value" /></span>
          </template>
          <template v-else>cancels</template>
        </p>
      </div>

      <div v-else-if="hasValue" class="content">
        <div class="header-row">
          <div class="title">Readability shortcut</div>
          <shortcut-chip :value="value" />
        </div>
        <p class="desc">Toggle readability for articles on a site</p>
        <div class="divider" />
        <button type="button" class="row" @click="startRecording">Change…</button>
        <button type="button" class="row danger" @click="remove">Remove</button>
      </div>

      <div v-else class="content">
        <div class="header-row">
          <div class="title">Readability shortcut</div>
          <button
            v-if="dismissible"
            type="button"
            class="dismiss"
            aria-label="Dismiss"
            @click="dismiss"
          >
            <icon-x />
          </button>
        </div>
        <p class="desc">Toggle readability for articles on a site</p>
        <button type="button" class="record-btn" @click="startRecording">
          <icon-keyboard />
          Record shortcut
        </button>
      </div>
    </menu-box>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import {
  keydownToShortcut,
  modifiersFromEvent,
  MODIFIER_KEYS,
} from './utils/keydown-to-shortcut';
import { shortcutStore } from './shortcut-store';

import MenuBox from './MenuBox.vue';
import ShortcutKbd from './ShortcutKbd.vue';
import ShortcutChip from './ShortcutChip.vue';
import IconKeyboard from '../icons/IconKeyboard.vue';
import IconX from '../icons/IconX.vue';

export default Vue.extend({
  name: 'ShortcutMenu',

  components: {
    MenuBox,
    ShortcutKbd,
    ShortcutChip,
    IconKeyboard,
    IconX,
  },

  props: {
    // True for the persistent, auto-shown invite (dismissible via its own X,
    // not by clicking outside); false for the menu opened from More.
    dismissible: {
      type: Boolean,
      default: false,
    },
  },

  data(): {
    liveModifiers: string;
  } {
    return {
      liveModifiers: '',
    };
  },

  computed: {
    value(): string {
      return shortcutStore.value();
    },

    hasValue(): boolean {
      return this.value.length > 0;
    },

    recording(): boolean {
      return shortcutStore.state.recording;
    },
  },

  mounted() {
    shortcutStore.ensureLoaded();
  },

  methods: {
    startRecording(): void {
      shortcutStore.setRecording(true);
      this.liveModifiers = '';
      this.$nextTick(() => {
        (this.$refs.root as HTMLElement).focus();
      });
    },

    stopRecording(): void {
      shortcutStore.setRecording(false);
      this.liveModifiers = '';
    },

    cancelRecording(): void {
      this.stopRecording();
    },

    remove(): void {
      shortcutStore.update('');
    },

    dismiss(): void {
      shortcutStore.dismissPrompt();
    },

    onKeydown(event: KeyboardEvent): void {
      if (!this.recording) {
        return;
      }

      // Stop it reaching an already-bound shortcut or the dock's Escape handler.
      event.stopPropagation();

      if (event.key === 'Escape' || event.key === 'Tab') {
        this.stopRecording();
        return;
      }

      event.preventDefault();

      this.liveModifiers = modifiersFromEvent(event).join('+');

      if (MODIFIER_KEYS.has(event.key)) {
        return;
      }

      const shortcut = keydownToShortcut(event);

      if (shortcut) {
        shortcutStore.update(shortcut);
        this.stopRecording();
      }
    },

    onKeyup(event: KeyboardEvent): void {
      if (!this.recording) {
        return;
      }

      event.stopPropagation();
      this.liveModifiers = modifiersFromEvent(event).join('+');
    },
  },
});
</script>

<style lang="scss" scoped>
.menu-root {
  outline: none;
}

.content {
  padding: 8px;
}

.title {
  font-weight: 600;
  font-size: 12.5px;
  line-height: 1.3;
  color: var(--main-foreground);
}

.header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 21px;

  .title {
    flex: 1 1 auto;
  }
}

.dismiss {
  all: unset;
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  color: var(--muted-foreground);

  svg {
    flex-shrink: 0;
  }

  &:hover {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--main-foreground);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--link-color);
  }
}

.desc {
  font-weight: 400;
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--muted-foreground);
  margin: 4px 0 14px;
}

.record-btn {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-weight: 400;
  font-size: 12px;
  line-height: 1;
  color: var(--main-foreground);
  background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
  border-radius: 7px;
  padding: 10px;
  cursor: pointer;

  svg {
    flex-shrink: 0;
    width: 19px;
    height: 14px;
  }

  &:hover {
    background: color-mix(in srgb, var(--main-foreground) 10%, transparent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--link-color);
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  background: color-mix(in srgb, var(--main-foreground) 7%, transparent);
  border-radius: 6px;
  padding: 4px 8px;
}

.chip-inline {
  padding: 2px 5px;
  margin: 0 1px;
}

.divider {
  height: 1px;
  margin: 8px 0 4px;
  background: var(--border-color);
}

.row {
  all: unset;
  box-sizing: border-box;
  display: block;
  width: calc(100% + 16px);
  margin: 0 -8px;
  font-weight: 400;
  font-size: 12.5px;
  line-height: 1;
  color: var(--main-foreground);
  padding: 9px 8px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--link-color);
  }

  &.danger {
    color: #d1453d;

    &:hover {
      background: rgba(209, 69, 61, 0.1);
    }
  }
}

.capture-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.capture-field {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 2px;
  background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
  border-radius: 6px;
  padding: 8px 9px;
  box-shadow: 0 0 0 2px var(--link-color);
}

.placeholder {
  color: var(--muted-foreground);
  font-weight: 400;
  font-size: 13px;
  line-height: 1;
  animation: shortcut-cursor-blink 1s step-end infinite;
}

.cancel {
  all: unset;
  box-sizing: border-box;
  font-weight: 400;
  font-size: 11.5px;
  line-height: 1;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: var(--main-foreground);
  }
}

.helper {
  font-weight: 400;
  font-size: 11px;
  line-height: 1.4;
  color: var(--muted-foreground);
  margin: 9px 0 0;
}

@keyframes shortcut-cursor-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>
