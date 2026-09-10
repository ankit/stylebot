<template>
  <div ref="root" class="recorder" tabindex="-1" @keydown="onKeydown" @keyup="onKeyup">
    <div v-if="recording" class="field recording">
      <span class="capture">
        <shortcut-kbd v-if="liveModifiers" :value="liveModifiers" />
        <span class="placeholder">_</span>
      </span>
      <button type="button" class="cancel" @click="stopRecording">Cancel</button>
    </div>

    <button
      v-else-if="hasValue"
      type="button"
      class="field has-value"
      @click="startRecording"
    >
      <shortcut-kbd :value="value" />
      <span class="clear" aria-label="Clear shortcut" @click.stop="clear">
        <icon-x />
      </span>
    </button>

    <button v-else type="button" class="record-btn" @click="startRecording">
      <icon-keyboard />
      Record a shortcut
    </button>

    <p v-if="recording" class="helper">Press a key to finish · Esc cancels</p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import {
  keydownToShortcut,
  modifiersFromEvent,
  MODIFIER_KEYS,
} from './utils/keydown-to-shortcut';

import ShortcutKbd from './ShortcutKbd.vue';
import { IconKeyboard, IconX } from '@stylebot/icons';

export default Vue.extend({
  name: 'ShortcutRecorderField',

  components: {
    ShortcutKbd,
    IconKeyboard,
    IconX,
  },

  props: {
    value: {
      type: String,
      required: true,
    },
  },

  data(): {
    recording: boolean;
    liveModifiers: string;
  } {
    return {
      recording: false,
      liveModifiers: '',
    };
  },

  computed: {
    hasValue(): boolean {
      return this.value.length > 0;
    },
  },

  methods: {
    startRecording(): void {
      this.recording = true;
      this.liveModifiers = '';
      this.$nextTick(() => {
        (this.$refs.root as HTMLElement).focus();
      });
    },

    stopRecording(): void {
      this.recording = false;
      this.liveModifiers = '';
    },

    clear(): void {
      this.$emit('update', '');
    },

    onKeydown(event: KeyboardEvent): void {
      if (!this.recording) {
        return;
      }

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
        this.$emit('update', shortcut);
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
.recorder {
  width: 100%;
  outline: none;
}

.field {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 7px 9px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--main-foreground) 4%, var(--main-background));
  cursor: pointer;
}

.field.has-value {
  &:hover {
    background: color-mix(in srgb, var(--main-foreground) 8%, var(--main-background));
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--link-color);
  }
}

.field.recording {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--link-color) 18%, transparent);
  cursor: default;
}

.capture {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
}

.placeholder {
  color: var(--muted-foreground);
  font-weight: 400;
  font-size: 13px;
  line-height: 1;
  animation: shortcut-recorder-blink 1s step-end infinite;
}

.clear {
  flex: none;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: var(--muted-foreground);

  &:hover {
    background: color-mix(in srgb, var(--main-foreground) 10%, transparent);
    color: var(--main-foreground);
  }

  svg {
    width: 9px;
    height: 9px;
  }
}

.cancel {
  all: unset;
  box-sizing: border-box;
  flex: none;
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
  border-radius: 8px;
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

.helper {
  font-weight: 400;
  font-size: 11px;
  line-height: 1.4;
  color: var(--muted-foreground);
  margin: 6px 0 0;
}

@keyframes shortcut-recorder-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>
