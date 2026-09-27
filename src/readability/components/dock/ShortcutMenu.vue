<template>
  <s-menu dense :min-width="232">
    <div class="content">
      <s-shortcut-recorder-field
        :value="value"
        :recording.sync="recording"
        @update="update"
      >
        <template #idle="{ start }">
          <template v-if="hasValue">
            <div class="header-row">
              <div class="title">{{ t('readability_shortcut') }}</div>
              <s-shortcut-chip :value="value" />
            </div>
            <s-text size="caption" variant="muted" class="desc">
              {{ t('readability_shortcut_description') }}
            </s-text>
            <div class="divider" />
            <div class="actions">
              <s-menu-item @click="start">
                {{ t('change_shortcut') }}
              </s-menu-item>
              <s-menu-item danger @click="remove">
                {{ t('remove') }}
              </s-menu-item>
            </div>
          </template>

          <template v-else>
            <div class="header-row">
              <div class="title">{{ t('readability_shortcut') }}</div>
              <button
                v-if="dismissible"
                type="button"
                class="dismiss"
                :aria-label="t('dismiss')"
                @click="dismiss"
              >
                <x-icon />
              </button>
            </div>
            <s-text size="caption" variant="muted" class="desc">
              {{ t('readability_shortcut_description') }}
            </s-text>
            <button type="button" class="record-btn" @click="start">
              <keyboard-icon />
              {{ t('record_shortcut') }}
            </button>
          </template>
        </template>

        <template #helper>
          <s-text size="caption" variant="muted" class="helper">
            {{ t('press_key_to_finish') }}
            <template v-if="hasValue">
              {{ t('esc_keeps') }}
              <span class="chip chip-inline">
                <s-shortcut-kbd :value="value" />
              </span>
            </template>
            <template v-else>{{ t('esc_cancels') }}</template>
          </s-text>
        </template>
      </s-shortcut-recorder-field>
    </div>
  </s-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import { shortcutStore } from './shortcut-store';

import {
  SMenuItem,
  SShortcutChip,
  SShortcutKbd,
  SShortcutRecorderField,
  SMenu,
  SText,
} from '@stylebot/components';
import { KeyboardIcon, XIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'ShortcutMenu',

  components: {
    SMenuItem,
    SShortcutKbd,
    SShortcutChip,
    SShortcutRecorderField,
    SMenu,
    SText,
    KeyboardIcon,
    XIcon,
  },

  props: {
    // True for the persistent, auto-shown invite (dismissible via its own X,
    // not by clicking outside); false for the menu opened from More.
    dismissible: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    value(): string {
      return shortcutStore.value();
    },

    hasValue(): boolean {
      return this.value.length > 0;
    },

    recording: {
      get(): boolean {
        return shortcutStore.state.recording;
      },

      set(recording: boolean): void {
        shortcutStore.setRecording(recording);
      },
    },
  },

  mounted() {
    shortcutStore.ensureLoaded();
  },

  methods: {
    update(value: string): void {
      shortcutStore.update(value);
    },

    remove(): void {
      shortcutStore.update('');
    },

    dismiss(): void {
      shortcutStore.dismissPrompt();
    },
  },
});
</script>

<style lang="scss" scoped>
.content {
  --menu-padding: 12px;
  padding: 8px;
}

.title {
  font-weight: 600;
  font-size: 12.5px;
  line-height: 1.3;
  color: var(--foreground);
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
  @include button-reset;

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
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
    color: var(--foreground);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--link-color);
  }
}

.actions {
  display: flex;
  flex-direction: column;
}

.desc {
  margin: 4px 0 14px;
}

.record-btn {
  @include button-reset;

  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-weight: 400;
  font-size: 12px;
  line-height: 1;
  color: var(--foreground);
  background: color-mix(in srgb, var(--foreground) 6%, transparent);
  border-radius: 7px;
  padding: 10px;
  cursor: pointer;

  svg {
    flex-shrink: 0;
    width: 19px;
    height: 14px;
  }

  &:hover {
    background: color-mix(in srgb, var(--foreground) 10%, transparent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--link-color);
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  background: color-mix(in srgb, var(--foreground) 7%, transparent);
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
  background: var(--border);
}

.helper {
  margin: 9px 0 0;
}
</style>
