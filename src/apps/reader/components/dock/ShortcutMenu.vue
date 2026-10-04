<template>
  <s-menu dense :min-width="232">
    <div class="content">
      <div class="header-row">
        <div class="title">{{ t('readability_shortcut') }}</div>
        <s-shortcut-chip v-if="value" :value="value" />
        <button
          v-else-if="dismissible"
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
      <button v-if="canChange" type="button" class="change-btn" @click="change">
        <keyboard-icon />
        {{ t(value ? 'modify_shortcut' : 'set_shortcut') }}
      </button>
      <s-text v-else size="caption" variant="muted">
        {{ t('change_shortcuts_in_safari_settings_extensions') }}
      </s-text>
    </div>
  </s-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import { shortcutStore } from './shortcut-store';

import { SShortcutChip, SMenu, SText } from '@stylebot/components';
import { KeyboardIcon, XIcon } from '@stylebot/icons';
import { canOpenShortcutsPage, openShortcutsPage } from '@stylebot/utils';

export default Vue.extend({
  name: 'ShortcutMenu',

  components: {
    SShortcutChip,
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

    canChange(): boolean {
      return canOpenShortcutsPage();
    },
  },

  mounted() {
    shortcutStore.ensureLoaded();
  },

  methods: {
    /**
     * Opens the browser's page for extension shortcuts, where this one is
     * set; going there answers the invite.
     */
    change(): void {
      shortcutStore.dismissPrompt();
      openShortcutsPage();
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

.desc {
  margin: 4px 0 14px;
}

.change-btn {
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
</style>
