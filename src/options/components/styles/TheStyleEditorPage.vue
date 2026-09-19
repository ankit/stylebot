<template>
  <div class="editor-page">
    <div class="editor-header">
      <icon-button class="back" title="Back" @click="attemptLeave">
        <chevron-left-icon />
      </icon-button>

      <div class="title-block">
        <div class="breadcrumb">
          <a href="#" @click.prevent="attemptLeave">
            {{ t('styles_options') }}
          </a>
          ›
        </div>

        <input
          v-model="url"
          class="url-input"
          placeholder="example.com"
          autofocus
        />
      </div>

      <toggle-switch
        v-if="existingStyle"
        class="enabled-toggle"
        size="lg"
        :value="existingStyle.enabled"
        @change="onToggleEnabled"
      >
        <span class="enabled-label">{{ t('enabled') }}</span>
      </toggle-switch>

      <style-row-menu
        :url="url"
        :size="30"
        @open-site="openSite"
        @copy-css="copyCss"
        @delete="showDeleteConfirm = true"
      />
    </div>

    <div class="editor-code-area">
      <code-editor
        :css="css"
        :autofocus="!!existingStyle"
        @update="css = $event"
      />
    </div>

    <div class="editor-footer">
      <s-text size="caption" variant="muted" class="stats">
        {{ lineCountLabel }} · {{ ruleCountLabel }}
        <template v-if="savedLabel">· {{ savedLabel }}</template>
      </s-text>

      <s-button variant="ghost" :disabled="!isDirty" @click="discard">
        {{ t('discard_changes') }}
      </s-button>

      <s-button :disabled="!valid" @click="save">
        {{ t('save') }}
      </s-button>
    </div>

    <confirm-dialog
      v-if="showDeleteConfirm"
      :title="`Delete style for ${url}`"
      :message="t('delete_style_warning')"
      :confirm-label="t('delete')"
      @cancel="showDeleteConfirm = false"
      @confirm="confirmDelete"
    />

    <confirm-dialog
      v-if="showLeaveConfirm"
      :title="t('discard_changes')"
      :message="t('unsaved_changes_warning')"
      :confirm-label="t('discard_changes')"
      @cancel="cancelLeave"
      @confirm="confirmLeave"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { NavigationGuardNext, Route } from 'vue-router';
import * as postcss from 'postcss';
import { formatDistanceToNow } from 'date-fns';

import { StyleWithoutUrl } from '@stylebot/types';
import {
  ToggleSwitch,
  IconButton,
  SText,
  SButton,
  ConfirmDialog,
} from '@stylebot/components';
import { ChevronLeftIcon } from '@stylebot/icons';

import StyleRowMenu from './StyleRowMenu.vue';
import CodeEditor from './CodeEditor.vue';

export default Vue.extend({
  name: 'TheStyleEditorPage',

  components: {
    ToggleSwitch,
    ChevronLeftIcon,
    IconButton,
    SText,
    SButton,
    ConfirmDialog,
    StyleRowMenu,
    CodeEditor,
  },

  beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext) {
    this.guardLeave(next);
  },

  beforeRouteUpdate(to: Route, from: Route, next: NavigationGuardNext) {
    this.guardLeave(next);
  },

  props: {
    // Empty string = a brand-new, unsaved style.
    initialUrl: {
      type: String,
      default: '',
    },
  },

  data(): {
    url: string;
    css: string;
    showDeleteConfirm: boolean;
    showLeaveConfirm: boolean;
    leaving: boolean;
    pendingNext: NavigationGuardNext | null;
  } {
    const existing = this.$store.state.styles[this.initialUrl];

    return {
      url: this.initialUrl,
      css: existing ? existing.css : '',
      showDeleteConfirm: false,
      showLeaveConfirm: false,
      leaving: false,
      pendingNext: null,
    };
  },

  computed: {
    existingStyle(): StyleWithoutUrl | undefined {
      return this.$store.state.styles[this.initialUrl];
    },

    isDirty(): boolean {
      const savedCss = this.existingStyle ? this.existingStyle.css : '';
      return this.url !== this.initialUrl || this.css !== savedCss;
    },

    lineCount(): number {
      return this.css.length ? this.css.split('\n').length : 0;
    },

    lineCountLabel(): string {
      return `${this.lineCount} line${this.lineCount === 1 ? '' : 's'}`;
    },

    ruleCount(): number | null {
      try {
        return postcss.parse(this.css).nodes.length;
      } catch {
        return null;
      }
    },

    ruleCountLabel(): string {
      return this.ruleCount === null
        ? '—'
        : `${this.ruleCount} rule${this.ruleCount === 1 ? '' : 's'}`;
    },

    savedLabel(): string {
      if (!this.existingStyle) {
        return '';
      }

      return `saved ${formatDistanceToNow(
        new Date(this.existingStyle.modifiedTime),
        {
          addSuffix: true,
        }
      )}`;
    },

    valid(): boolean {
      return this.url.trim().length > 0 && this.ruleCount !== null;
    },
  },

  methods: {
    guardLeave(next: NavigationGuardNext): void {
      if (this.isDirty && !this.leaving) {
        this.pendingNext = next;
        this.showLeaveConfirm = true;
        return;
      }

      next();
    },

    attemptLeave(): void {
      this.$emit('back');
    },

    cancelLeave(): void {
      this.pendingNext?.(false);
      this.pendingNext = null;
      this.showLeaveConfirm = false;
    },

    confirmLeave(): void {
      const next = this.pendingNext;
      this.pendingNext = null;
      this.showLeaveConfirm = false;
      this.leaving = true;
      next?.();
    },

    discard(): void {
      this.leaving = true;
      this.$emit('back');
    },

    onToggleEnabled(enabled: boolean): void {
      this.$store.dispatch(
        enabled ? 'enableStyle' : 'disableStyle',
        this.initialUrl
      );
    },

    openSite(): void {
      window.open(`https://${this.url}`, '_blank');
    },

    copyCss(): void {
      navigator.clipboard.writeText(this.css);
    },

    confirmDelete(): void {
      this.$store.dispatch('deleteStyle', this.initialUrl);
      this.showDeleteConfirm = false;
      this.leaving = true;
      this.$emit('back');
    },

    save(): void {
      this.leaving = true;
      this.$emit('save', {
        initialUrl: this.initialUrl,
        url: this.url,
        css: this.css,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.editor-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--panel-border);
}

.back {
  flex: none;
}

.title-block {
  flex: 1;
  min-width: 0;
}

.breadcrumb {
  font-weight: 400;
  font-size: 12px;
  line-height: 1.3;
  color: var(--text-muted);
}

.url-input {
  all: unset;
  display: block;
  width: 100%;
  font-weight: 600;
  font-size: 15.5px;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;

  &::placeholder {
    font-weight: 400;
    color: var(--text-muted);
  }
}

.switch.enabled-toggle {
  flex: none;
  width: auto;
}

.enabled-label {
  font-weight: 400;
  font-size: 13px;
  line-height: 1.3;
  color: var(--text-muted);
}

.editor-code-area {
  flex: 1;
  min-height: 0;
  background: #fcfcfd;

  @include dark-mode {
    background: #1a1b1e;
  }
}

.editor-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--panel-border);
}

.stats {
  flex: 1;
  min-width: 0;
}
</style>
