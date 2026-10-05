<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';

import type {
  StylebotEditingMode,
  StylebotLayout,
  StylebotEditorCommands,
} from '@stylebot/types';
import { isFieldTarget, isMac } from '@stylebot/utils';
import { getDeclarationValue } from '@stylebot/css';
import { INSPECT_KEYS } from '@stylebot/highlighter';
import { getPageBridge } from '@stylebot/page-bridge';

import { undoKeyFor } from '../../store/undo-stack';
import { hasSidePanel } from '../../utils/side-panel';

export default Vue.extend({
  name: 'TheKeyboardShortcuts',

  computed: {
    host(): string {
      return this.$store.state.host;
    },
    visible(): boolean {
      return this.$store.state.visible;
    },
    inspecting(): boolean {
      return this.$store.state.inspecting;
    },
    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },
    activeSelector(): string {
      return this.$store.state.activeSelector;
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
    visible: {
      // `visible` can already be true by the time this mounts, so a
      // non-immediate watcher would miss attaching the listener.
      immediate: true,
      handler(newValue: boolean): void {
        if (newValue) {
          this.attachStylebotShortcuts();
        } else {
          this.detachStylebotShortcuts();
        }
      },
    },
  },

  methods: {
    attachStylebotShortcuts(): void {
      // Capture phase: some sites (e.g. GitHub) bind their own shortcuts on
      // document in the bubble phase, which would otherwise win the race.
      document.addEventListener('keydown', this.handleStylebotShortcut, true);
    },

    detachStylebotShortcuts(): void {
      document.removeEventListener(
        'keydown',
        this.handleStylebotShortcut,
        true
      );
    },

    toggleInspect(): void {
      if (this.mode === 'basic' || this.mode === 'chat') {
        this.$store.commit('setInspecting', !this.inspecting);
      }
    },

    toggleVisibilityOfActiveSelector(): void {
      if (this.activeSelector) {
        const value = getDeclarationValue(
          this.$store.getters.activeRule,
          'display'
        );

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
      this.$store.dispatch('setDockLocation', 'left');
    },

    dockRight(): void {
      this.$store.dispatch('setDockLocation', 'right');
    },

    dockWindow(): void {
      this.$store.dispatch('setDockLocation', 'window');
    },

    dockSidePanel(): void {
      this.$store.dispatch('setDockLocation', 'sidepanel');
    },

    toggleAdjustPageLayout(): void {
      if (this.host !== 'page') {
        return;
      }

      this.$store.dispatch('setLayout', {
        ...this.layout,
        adjustPageLayout: !this.layout.adjustPageLayout,
      });
    },

    handleEscape(): void {
      this.$store.dispatch('escape');
    },

    /**
     * Only taken from the panel, or when nothing on the page holds focus:
     * Cmd/Ctrl+Z means something to most page widgets.
     */
    handleUndoShortcut(event: KeyboardEvent, path: Array<EventTarget>): void {
      const key = undoKeyFor(event, isMac());

      if (!key) {
        return;
      }

      const target = path[0] as HTMLElement;
      const inPanel =
        this.host !== 'page' ||
        target === document.body ||
        target === document.documentElement ||
        path.some(node => (node as HTMLElement).id === 'stylebot');

      if (!inPanel) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      this.$store.dispatch(key);
    },

    handleStylebotShortcut(event: KeyboardEvent): void {
      const path = event.composedPath();
      const target = path[0];

      // Ahead of the field check: undo/redo stay available while a panel
      // field has focus, where a style edit is what the user just made.
      if (event.metaKey || event.altKey || event.ctrlKey) {
        this.handleUndoShortcut(event, path);
        return;
      }

      // Escape in a field is left to the section around it, which moves
      // focus out of the field.
      if (isFieldTarget(target)) {
        return;
      }

      // Outside the page, focus stays in the editor while the pointer
      // inspects the page, so the page never sees these keys itself.
      if (
        this.host !== 'page' &&
        this.inspecting &&
        INSPECT_KEYS.includes(event.key)
      ) {
        event.preventDefault();
        event.stopPropagation();

        getPageBridge().inspectKey(event.key);
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

      // Switch to chat
      if (event.key === this.editorCommands.chat) {
        event.preventDefault();
        event.stopPropagation();

        this.$store.dispatch('setMode', 'chat');
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

      // Move stylebot into its own window
      if (event.key === this.editorCommands.dockWindow) {
        event.preventDefault();
        event.stopPropagation();

        this.dockWindow();
      }

      // Move stylebot into the side panel
      if (hasSidePanel() && event.key === this.editorCommands.dockSidePanel) {
        event.preventDefault();
        event.stopPropagation();

        this.dockSidePanel();
      }

      // Toggle page layout adjustment
      if (event.key === this.editorCommands.pageLayout) {
        event.preventDefault();
        event.stopPropagation();

        this.toggleAdjustPageLayout();
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
