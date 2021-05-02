<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';

import { Declaration, Rule } from 'postcss';
import {
  StylebotEditingMode,
  StylebotLayout,
  StylebotEditorCommands,
} from '@stylebot/types';

export default Vue.extend({
  name: 'TheKeyboardShortcuts',

  computed: {
    visible(): boolean {
      return this.$store.state.visible;
    },
    inspecting(): boolean {
      return this.$store.state.inspecting;
    },
    resizing(): boolean {
      return this.$store.state.resizing;
    },
    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },
    activeSelector(): string {
      return this.$store.state.activeSelector;
    },
    activeRule(): Rule {
      return this.$store.getters.activeRule;
    },
    help(): boolean {
      return this.$store.state.help;
    },
    layout(): StylebotLayout {
      return this.$store.state.options.layout;
    },
    editorCommands(): StylebotEditorCommands {
      return this.$store.state.editorCommands;
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

  methods: {
    attachStylebotShortcuts(): void {
      document.addEventListener('keydown', this.handleStylebotShortcut);
    },

    detachStylebotShortcuts(): void {
      document.removeEventListener('keydown', this.handleStylebotShortcut);
    },

    toggleInspect(): void {
      if (this.mode === 'basic') {
        this.$store.commit('setInspecting', !this.inspecting);
      }
    },

    toggleResize(): void {
      this.$store.commit('setResizing', !this.resizing);
    },

    toggleVisibilityOfActiveSelector(): void {
      if (this.activeSelector) {
        let value = '';

        if (this.activeRule) {
          this.activeRule.clone().walkDecls('display', (decl: Declaration) => {
            value = decl.value;
          });
        }

        this.$store.dispatch('applyDeclaration', {
          property: 'display',
          value: value === 'none' ? '' : 'none',
        });
      }
    },

    toggleHelp(): void {
      this.$store.commit('setInspecting', false);
      this.$store.commit('setHelp', !this.help);
    },

    dockLeft(): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        dockLocation: 'left',
      });
    },

    dockRight(): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        dockLocation: 'right',
      });
    },

    toggleAdjustPageLayout(): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        adjustPageLayout: !this.layout.adjustPageLayout,
      });
    },

    handleEscape(): void {
      if (this.help) {
        this.$store.commit('setHelp', false);
        return;
      }

      this.$store.dispatch('closeStylebot');
    },

    handleStylebotShortcut(event: KeyboardEvent): void {
      const target = event.composedPath()[0] as HTMLElement;
      const tagName = target.tagName.toLowerCase();

      if (tagName === 'input' || tagName === 'textarea') {
        return;
      }

      if (event.metaKey || event.altKey || event.ctrlKey) {
        return;
      }

      // Toggle inspect
      if (event.key === this.editorCommands.inspect) {
        event.preventDefault();
        event.stopPropagation();

        this.toggleInspect();
      }

      // Toggle visibility css of selected element(s)
      if (event.key === this.editorCommands.hide) {
        event.preventDefault();
        event.stopPropagation();

        this.toggleVisibilityOfActiveSelector();
      }

      // Switch to basic editor
      if (event.key === this.editorCommands.basic) {
        event.preventDefault();
        event.stopPropagation();

        this.$store.dispatch('setMode', 'basic');
      }

      // Switch to code editor
      if (event.key === this.editorCommands.code) {
        event.preventDefault();
        event.stopPropagation();

        this.$store.dispatch('setMode', 'code');
      }

      // Switch to magic editor
      if (event.key === this.editorCommands.magic) {
        event.preventDefault();
        event.stopPropagation();

        this.$store.dispatch('setMode', 'magic');
      }

      // Show shortcut help
      if (event.key === this.editorCommands.help) {
        event.preventDefault();
        event.stopPropagation();

        this.toggleHelp();
      }

      // Dock stylebot to the left
      if (event.key === this.editorCommands.dockLeft) {
        event.preventDefault();
        event.stopPropagation();

        this.dockLeft();
      }

      // Dock stylebot to the right
      if (event.key === this.editorCommands.dockRight) {
        event.preventDefault();
        event.stopPropagation();

        this.dockRight();
      }

      // Toggle page layout adjustment
      if (event.key === this.editorCommands.pageLayout) {
        event.preventDefault();
        event.stopPropagation();

        this.toggleAdjustPageLayout();
      }

      // Toggle resizing
      if (event.key === this.editorCommands.resize) {
        event.preventDefault();
        event.stopPropagation();

        this.toggleResize();
      }

      // Hide help / stylebot
      if (event.key === this.editorCommands.close) {
        event.preventDefault();
        event.stopPropagation();

        this.handleEscape();
      }
    },
  },
});
</script>
