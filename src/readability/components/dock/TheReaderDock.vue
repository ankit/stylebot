<template>
  <div class="dock" :style="{ opacity: dockOpacity }" @focusin="wake">
    <div class="buttons">
      <close-button @click="close" @hover="showTip($event, closeTipText)" @unhover="hideTip" />

      <typography-button
        ref="typographyBtn"
        :active="activeMenu === 'settings'"
        @click="toggleMenu('settings')"
        @hover="showTip($event, 'Reading settings')"
        @unhover="hideTip"
      />

      <more-button
        ref="moreBtn"
        :active="activeMenu === 'more'"
        @click="toggleMenu('more')"
      />
    </div>

    <settings-menu
      v-if="activeMenu === 'settings'"
      ref="settingsMenu"
      :theme="theme"
      :font="font"
      :size="size"
      :width="width"
      :justify="justify"
      :line-height="lineHeight"
      @update="$emit('update', $event)"
    />

    <more-menu v-else-if="activeMenu === 'more'" ref="moreMenu" @close="activeMenu = null" />

    <tooltip v-if="tip" :text="tip" :top="tipTop" :left="tipLeft" />
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

import { ReadabilityTheme } from '@stylebot/types';

import { closeReader } from '../../dock-actions';

import CloseButton from './CloseButton.vue';
import TypographyButton from './TypographyButton.vue';
import MoreButton from './MoreButton.vue';
import SettingsMenu from './SettingsMenu.vue';
import MoreMenu from './MoreMenu.vue';
import Tooltip from './Tooltip.vue';

// Icons stay lit while the pointer is within this many px of the dock.
const WAKE_RADIUS = 340;
const IDLE_DELAY_MS = 2600;
const WAKE_EVENTS = ['mousemove', 'scroll', 'touchstart'] as const;

type MenuName = 'settings' | 'more';

// Which button opens each menu, and which ref to return focus to on Escape.
const MENUS: Record<MenuName, { triggerRef: string; menuRef: string }> = {
  settings: { triggerRef: 'typographyBtn', menuRef: 'settingsMenu' },
  more: { triggerRef: 'moreBtn', menuRef: 'moreMenu' },
};

export default Vue.extend({
  name: 'TheReaderDock',

  components: {
    CloseButton,
    TypographyButton,
    MoreButton,
    SettingsMenu,
    MoreMenu,
    Tooltip,
  },

  props: {
    theme: {
      type: String as PropType<ReadabilityTheme>,
      required: true,
    },

    font: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    width: {
      type: Number,
      required: true,
    },

    justify: {
      type: Boolean,
      required: true,
    },

    lineHeight: {
      type: Number,
      required: true,
    },
  },

  data(): {
    activeMenu: MenuName | null;
    idle: boolean;
    tip: string;
    tipTop: number;
    tipLeft: number;
    idleTimeout: ReturnType<typeof setTimeout> | null;
  } {
    return {
      activeMenu: null,
      idle: false,
      tip: '',
      tipTop: 0,
      tipLeft: 0,
      idleTimeout: null,
    };
  },

  computed: {
    anyMenuOpen(): boolean {
      return this.activeMenu !== null;
    },

    dockOpacity(): number {
      return this.idle && !this.anyMenuOpen ? 0.45 : 1;
    },

    closeTipText(): string {
      return `Turn off readability for ${document.domain}`;
    },
  },

  watch: {
    anyMenuOpen(isOpen: boolean): void {
      // Only listen while a menu is open, so a closed dock costs nothing.
      if (isOpen) {
        document.addEventListener('click', this.onDocumentClick);
        document.addEventListener('keydown', this.onDocumentKeydown);
      } else {
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('keydown', this.onDocumentKeydown);
      }
    },
  },

  mounted() {
    this.wake();
    WAKE_EVENTS.forEach(event => window.addEventListener(event, this.wake, { passive: true }));
  },

  beforeDestroy() {
    WAKE_EVENTS.forEach(event => window.removeEventListener(event, this.wake));
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onDocumentKeydown);
    this.clearIdleTimeout();
  },

  methods: {
    // event.target gets retargeted to the shadow host outside it — use
    // composedPath() to test containment reliably across that boundary.
    onDocumentClick(event: MouseEvent): void {
      if (!event.composedPath().includes(this.$el)) {
        this.activeMenu = null;
      }
    },

    onDocumentKeydown(event: KeyboardEvent): void {
      if (event.key !== 'Escape' || !this.activeMenu) {
        return;
      }

      // Return focus to whichever button opened the menu, rather than
      // dropping it back to the document.
      const { triggerRef } = MENUS[this.activeMenu];
      this.activeMenu = null;

      ((this.$refs[triggerRef] as Vue).$el as HTMLElement).focus();
    },

    // Moves focus into the menu once it's rendered, so keyboard users land
    // somewhere usable instead of on nothing.
    focusFirstIn(ref: string): void {
      this.$nextTick(() => {
        const menu = this.$refs[ref] as Vue | undefined;
        (menu?.$el as HTMLElement | undefined)?.querySelector<HTMLElement>('button')?.focus();
      });
    },

    // Proximity: icons stay lit while the pointer is near the top-right dock,
    // and fade after IDLE_DELAY_MS of inactivity once it's out of reach.
    // Typed as Event since this doubles as the mousemove/scroll/touchstart
    // listener and the template's @focusin handler.
    wake(event?: Event): void {
      let near = true;

      if (event && event.type === 'mousemove') {
        const mouseEvent = event as MouseEvent;
        const dx = Math.max(0, window.innerWidth - 60 - mouseEvent.clientX);
        const dy = Math.max(0, mouseEvent.clientY - 40);
        near = Math.sqrt(dx * dx + dy * dy) < WAKE_RADIUS;
      }

      if (near) {
        if (this.idle) {
          this.idle = false;
        }
        this.clearIdleTimeout();
        this.idleTimeout = setTimeout(() => {
          if (!this.anyMenuOpen) {
            this.idle = true;
          }
        }, IDLE_DELAY_MS);
      } else if (!this.idle && !this.anyMenuOpen) {
        this.clearIdleTimeout();
        this.idle = true;
      }
    },

    clearIdleTimeout(): void {
      if (this.idleTimeout) {
        clearTimeout(this.idleTimeout);
      }
    },

    showTip(event: MouseEvent, text: string): void {
      if (this.anyMenuOpen) {
        return;
      }

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.tip = text;
      this.tipTop = Math.round(rect.bottom + 8);
      this.tipLeft = Math.round(rect.left + rect.width / 2);
    },

    hideTip(): void {
      this.tip = '';
    },

    close(): void {
      closeReader();
    },

    toggleMenu(menu: MenuName): void {
      this.activeMenu = this.activeMenu === menu ? null : menu;
      this.hideTip();

      if (this.activeMenu === menu) {
        this.focusFirstIn(MENUS[menu].menuRef);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.dock {
  position: fixed;
  top: 18px;
  right: 22px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu,
    'Helvetica Neue', sans-serif;
  transition: opacity 0.32s ease;

  * {
    transition: background-color 0.2s ease, color 0.2s ease,
      border-color 0.2s ease, box-shadow 0.2s ease;
  }
}

.buttons {
  display: flex;
  gap: 4px;
}
</style>
