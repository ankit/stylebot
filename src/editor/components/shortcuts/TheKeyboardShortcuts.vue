<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';

import {
  StylebotShortcutMetaKey,
  StylebotEditingMode,
  StylebotPlacement,
} from '../../../types';

import { Declaration, Rule } from 'postcss';
import { enableStyle, disableStyle } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheKeyboardShortcuts',

  computed: {
    url(): string {
      return this.$store.state.url;
    },
    enabled(): boolean {
      return this.$store.state.enabled;
    },
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
    help(): boolean {
      return this.$store.state.help;
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
      // open / close stylebot - default is Alt+m. customizable by user.
      if (event.keyCode === this.shortcutKey) {
        if (
          (this.shortcutMetaKey === 'ctrl' && event.ctrlKey) ||
          (this.shortcutMetaKey === 'alt' && event.altKey) ||
          (this.shortcutMetaKey === 'shift' && event.shiftKey) ||
          this.shortcutMetaKey === 'none'
        ) {
          if (this.visible) {
            this.$store.dispatch('closeStylebot');
          } else {
            this.$store.dispatch('openStylebot');
          }
        }
      }

      // toggle styling on page - Alt+t
      if (event.keyCode === 84 && event.altKey) {
        if (!this.visible) {
          if (this.enabled) {
            disableStyle(this.url);
          } else {
            enableStyle(this.url);
          }
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
        event.preventDefault();
        event.stopPropagation();

        if (this.mode === 'basic') {
          this.$store.commit('setInspecting', !this.inspecting);
        }
      }

      // p - Toggle editor position
      if (event.keyCode === 80) {
        event.preventDefault();
        event.stopPropagation();

        this.$store.commit(
          'setPosition',
          this.position === 'left' ? 'right' : 'left'
        );
      }

      // h - Toggle visibility css of selected element(s)
      if (event.keyCode === 72) {
        if (this.activeRule) {
          event.preventDefault();
          event.stopPropagation();

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
        event.preventDefault();
        event.stopPropagation();

        this.$store.dispatch('setMode', 'basic');
      }

      // c - switch to code editor
      if (event.keyCode === 67) {
        event.preventDefault();
        event.stopPropagation();

        this.$store.dispatch('setMode', 'code');
      }

      // m - switch to magic editor
      if (event.keyCode === 77) {
        event.preventDefault();
        event.stopPropagation();

        this.$store.dispatch('setMode', 'magic');
      }

      // ? - show shortcut help
      if (event.keyCode === 191 && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();

        this.$store.commit('setInspecting', false);
        this.$store.commit('setHelp', true);
      }

      // esc - if help is visible, close help. else, close stylebot
      if (event.keyCode === 27) {
        event.preventDefault();
        event.stopPropagation();

        if (this.help) {
          this.$store.commit('setHelp', false);
          return;
        }

        this.$store.commit('closeStylebot');
      }
    },
  },
});
</script>
