<template>
  <div
    ref="root"
    class="recorder"
    tabindex="-1"
    @keydown="onKeydown"
    @keyup="onKeyup"
  >
    <div v-if="isRecording" class="field recording">
      <span class="capture">
        <s-shortcut-kbd v-if="liveModifiers" :value="liveModifiers" />
        <span class="placeholder">_</span>
      </span>
      <button type="button" class="cancel" @click="stopRecording">
        {{ t('cancel') }}
      </button>
    </div>

    <slot v-else name="idle" :start="startRecording">
      <div
        v-if="hasValue"
        class="field has-value"
        role="button"
        tabindex="0"
        @click="startRecording"
        @keydown.enter="startRecording"
        @keydown.space.prevent="startRecording"
      >
        <s-shortcut-kbd :value="value" />
        <button
          type="button"
          class="clear"
          :aria-label="t('clear_shortcut')"
          @click.stop="clear"
        >
          <icon-x />
        </button>
      </div>

      <button v-else type="button" class="record-btn" @click="startRecording">
        <icon-keyboard />
        {{ t('record_a_shortcut') }}
      </button>
    </slot>

    <slot v-if="isRecording" name="helper">
      <p class="helper">
        {{ t('press_key_to_finish') }} {{ t('esc_cancels') }}
      </p>
    </slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import {
  keydownToShortcut,
  modifiersFromEvent,
  MODIFIER_KEYS,
} from '@stylebot/utils';

import SShortcutKbd from './SShortcutKbd.vue';
import { IconKeyboard, IconX } from '@stylebot/icons';

export default Vue.extend({
  name: 'SShortcutRecorderField',

  components: {
    SShortcutKbd,
    IconKeyboard,
    IconX,
  },

  props: {
    value: {
      type: String,
      required: true,
    },

    recording: {
      type: Boolean,
      default: false,
    },
  },

  data(): {
    isRecording: boolean;
    liveModifiers: string;
  } {
    return {
      isRecording: this.recording,
      liveModifiers: '',
    };
  },

  computed: {
    hasValue(): boolean {
      return this.value.length > 0;
    },
  },

  watch: {
    recording(recording: boolean): void {
      this.isRecording = recording;
      this.liveModifiers = '';
    },
  },

  methods: {
    setRecording(recording: boolean): void {
      this.isRecording = recording;
      this.liveModifiers = '';
      this.$emit('update:recording', recording);
    },

    startRecording(): void {
      this.setRecording(true);
      this.$nextTick(() => {
        (this.$refs.root as HTMLElement).focus();
      });
    },

    stopRecording(): void {
      this.setRecording(false);
    },

    clear(): void {
      this.$emit('update', '');
    },

    onKeydown(event: KeyboardEvent): void {
      if (!this.isRecording) {
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
      if (!this.isRecording) {
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
  @include button-reset;

  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 7px 9px;
  border-radius: 8px;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--text-primary) 4%, var(--panel-surface));
  cursor: pointer;
}

.field.has-value {
  &:hover {
    background: color-mix(
      in srgb,
      var(--text-primary) 8%,
      var(--panel-surface)
    );
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent);
  }
}

.field.recording {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
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
  color: var(--text-muted);
  font-weight: 400;
  font-size: 13px;
  line-height: 1;
  animation: shortcut-recorder-blink 1s step-end infinite;
}

.clear {
  @include button-reset;

  flex: none;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, var(--text-primary) 10%, transparent);
    color: var(--text-primary);
  }

  @include focus-ring;

  svg {
    width: 12px;
    height: 12px;
  }
}

.cancel {
  @include button-reset;

  flex: none;
  font-weight: 400;
  font-size: 11.5px;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: var(--text-primary);
  }
}

.record-btn {
  @include button-reset;

  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-weight: 500;
  font-size: 13px;
  line-height: 1;
  color: var(--text-primary);
  background: color-mix(in srgb, var(--text-primary) 4%, var(--panel-surface));
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;

  svg {
    flex-shrink: 0;
    width: 19px;
    height: 14px;
  }

  &:hover {
    background: color-mix(
      in srgb,
      var(--text-primary) 8%,
      var(--panel-surface)
    );
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent);
  }
}

.helper {
  font-weight: 400;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-muted);
  margin: 6px 0 0;
}

@keyframes shortcut-recorder-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>
