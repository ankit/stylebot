<template>
  <div v-if="help">
    HELLPPPP!!!
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import {
  StylebotShortcutMetaKey,
  StylebotEditingMode,
  StylebotPlacement,
} from '../../../types';

import { Declaration, Rule } from 'postcss';

export default Vue.extend({
  name: 'InstallKeyboardShortcuts',

  data(): { help: boolean } {
    return {
      help: false,
    };
  },

  computed: {
    visible(): boolean {
      return this.$store.state.visible;
    },
    shortcutKey(): number {
      return this.$store.state.options.shortcutKey;
    },
    shortcutMetaKey(): StylebotShortcutMetaKey {
      return this.$store.state.options.shortcutMetaKey;
    },
    inspecting(): boolean {
      return this.$store.state.inspecting;
    },
    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },
    position(): StylebotPlacement {
      return this.$store.state.position;
    },
    activeRule(): Rule {
      return this.$store.getters.activeRule;
    },
  },

  watch: {
    visible(newValue: boolean): void {
      if (newValue) {
        this.attachStylebotShortcuts();
      } else {
        this.detachStylebotShortcuts();
      }
    },
  },

  mounted(): void {
    this.attachGlobalShortcuts();
  },

  beforeDestroy(): void {
    this.detachGlobalShortcuts();
  },

  methods: {
    attachGlobalShortcuts(): void {
      window.addEventListener('keydown', this.handleGlobalShortcut);
    },
    detachGlobalShortcuts(): void {
      window.removeEventListener('keydown', this.handleGlobalShortcut);
    },
    handleGlobalShortcut(event: KeyboardEvent): void {
      // open / close stylebot
      if (event.keyCode === this.shortcutKey) {
        if (
          (this.shortcutMetaKey === 'ctrl' && event.ctrlKey) ||
          (this.shortcutMetaKey === 'alt' && event.altKey) ||
          (this.shortcutMetaKey === 'shift' && event.shiftKey) ||
          this.shortcutMetaKey === 'none'
        ) {
          if (this.visible) {
            this.$store.commit('hideStylebot');
          } else {
            this.$store.commit('showStylebot');
          }
        }
      }

      // toggle styling on page - Alt+t
      if (event.keyCode === 84 && event.altKey) {
        if (!this.visible) {
          //
        }
      }
    },

    attachStylebotShortcuts(): void {
      window.addEventListener('keydown', this.handleStylebotShortcut);
    },
    detachStylebotShortcuts(): void {
      window.removeEventListener('keydown', this.handleStylebotShortcut);
    },
    handleStylebotShortcut(event: KeyboardEvent): void {
      const target = event.composedPath()[0] as HTMLElement;
      if (target.tagName.toLowerCase() === 'input') {
        return;
      }

      // i - Toggle inspect
      if (event.keyCode === 73) {
        if (this.mode === 'basic') {
          this.$store.commit('setInspecting', !this.inspecting);
        }
      }

      // p - Toggle editor position
      if (event.keyCode === 80) {
        this.$store.commit(
          'setPosition',
          this.position === 'left' ? 'right' : 'left'
        );
      }

      // h - Toggle visibility css of selected element(s)
      if (event.keyCode === 72) {
        if (this.activeRule) {
          let value = '';

          this.activeRule.clone().walkDecls('display', (decl: Declaration) => {
            value = decl.value;
          });

          this.$store.dispatch('applyDeclaration', {
            property: 'display',
            value: value === 'none' ? '' : 'none',
          });
        }
      }

      // b - switch to basic editor
      if (event.keyCode === 66) {
        this.$store.dispatch('setMode', 'basic');
      }
      // c - switch to code editor
      if (event.keyCode === 67) {
        this.$store.dispatch('setMode', 'code');
      }
      // m - switch to magic editor
      if (event.keyCode === 77) {
        this.$store.dispatch('setMode', 'magic');
      }

      // ? - show shortcut help
      if (event.keyCode === 191 && event.shiftKey) {
        this.help = true;
      }

      // esc - if help is visible, close help. else, close stylebot
      if (event.keyCode === 27) {
        if (this.help) {
          this.help = false;
          return;
        }

        this.$store.commit('hideStylebot');
      }
    },
  },
});
</script>
