<template>
  <div class="editor-page">
    <div class="editor-header">
      <div class="title-block">
        <a href="#" class="back-link" @click.prevent="attemptLeave">
          <chevron-left-icon :size="10" />
          {{ t('styles_options') }}
        </a>

        <input
          v-model="url"
          class="url-input"
          placeholder="example.com"
          autofocus
        />
      </div>

      <s-toggle-switch
        v-if="existingStyle"
        class="enabled-toggle"
        :value="existingStyle.enabled"
        @change="onToggleEnabled"
      >
        <s-text as="span">{{ t('enabled') }}</s-text>
      </s-toggle-switch>

      <style-row-menu
        :url="url"
        :size="28"
        @open-site="openSite"
        @copy-css="copyCss"
        @delete="showDeleteConfirm = true"
      />
    </div>

    <div v-if="existingStyle" class="profile-bar">
      <div class="profile-tabs" role="tablist">
        <button
          v-for="id in profileIds"
          :key="id"
          type="button"
          role="tab"
          class="profile-tab"
          :class="{ selected: id === selectedProfile }"
          :aria-selected="id === selectedProfile ? 'true' : 'false'"
          @click="selectedProfile = id"
        >
          <check-icon
            v-if="id === activeProfile"
            :size="12"
            class="tab-check"
          />
          {{ profileName(id) }}
          <span v-if="id === activeProfile" class="visually-hidden">
            {{ t('active') }}
          </span>
        </button>
      </div>

      <s-button
        class="create-button"
        size="small"
        variant="ghost"
        @click="dialog = 'new'"
      >
        {{ t('create_profile') }}
      </s-button>

      <s-anchored-menu>
        <template #trigger="{ toggle }">
          <icon-menu-trigger
            :size="28"
            :bordered="false"
            :title="t('profile_actions')"
            @click="toggle"
          />
        </template>

        <template #default="{ close }">
          <s-menu dense :min-width="160">
            <s-menu-item
              v-if="selectedProfile !== activeProfile"
              @click="
                useSelectedProfile();
                close();
              "
            >
              {{ t('use_this_profile') }}
            </s-menu-item>
            <s-menu-item
              @click="
                dialog = 'rename';
                close();
              "
            >
              {{ t('rename') }}
            </s-menu-item>
            <s-menu-item
              @click="
                duplicateSelected();
                close();
              "
            >
              {{ t('duplicate') }}
            </s-menu-item>
            <s-menu-item
              v-if="profileIds.length > 1"
              danger
              @click="
                showDeleteProfileConfirm = true;
                close();
              "
            >
              {{ t('delete') }}
            </s-menu-item>
          </s-menu>
        </template>
      </s-anchored-menu>
    </div>

    <div class="editor-code-area">
      <code-editor
        :key="selectedProfile"
        :css="css"
        :autofocus="!!existingStyle"
        @update="css = $event"
      />
    </div>

    <div class="editor-footer">
      <s-text variant="muted" class="stats">
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

    <s-confirm-dialog
      v-if="showDeleteConfirm"
      :title="t('delete_style_for_url', [url])"
      :message="t('delete_style_warning')"
      :confirm-label="t('delete')"
      @cancel="showDeleteConfirm = false"
      @confirm="confirmDelete"
    />

    <s-prompt-dialog
      v-if="dialog"
      :title="dialogTitle"
      :label="t('profile_name')"
      :value="dialog === 'rename' ? selectedName : ''"
      :confirm-label="dialog === 'rename' ? t('rename') : t('create')"
      :cancel-label="t('cancel')"
      :validate="validateProfileName"
      @confirm="onProfileDialogConfirm"
      @cancel="dialog = null"
    />

    <s-confirm-dialog
      v-if="showDeleteProfileConfirm"
      :title="t('delete_profile')"
      :message="t('delete_profile_warning', [selectedName])"
      :confirm-label="t('delete')"
      :cancel-label="t('cancel')"
      @cancel="showDeleteProfileConfirm = false"
      @confirm="confirmDeleteProfile"
    />

    <s-confirm-dialog
      v-if="showLeaveConfirm"
      :title="t('discard_changes')"
      :message="t('unsaved_changes_warning')"
      :confirm-label="t('discard_changes')"
      @cancel="cancelLeave"
      @confirm="confirmLeave"
    />

    <s-confirm-dialog
      v-if="showReplaceConfirm"
      :title="t('replace_style')"
      :message="t('replace_style_warning', [url])"
      :confirm-label="t('replace')"
      @cancel="showReplaceConfirm = false"
      @confirm="confirmReplace"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { NavigationGuardNext, Route } from 'vue-router';
import { formatDistanceToNow } from 'date-fns';

import type { StyleWithoutUrl } from '@stylebot/types';
import {
  SToggleSwitch,
  SText,
  SButton,
  SAnchoredMenu,
  SMenu,
  SMenuItem,
  SConfirmDialog,
  SPromptDialog,
} from '@stylebot/components';
import { countRules } from '@stylebot/css';
import { CheckIcon, ChevronLeftIcon } from '@stylebot/icons';
import { DEFAULT_PROFILE_ID, expandProfiles } from '@stylebot/saved-styles';
import type { ExpandedProfiles } from '@stylebot/saved-styles';

import StyleRowMenu from './StyleRowMenu.vue';
import CodeEditor from './CodeEditor.vue';
import IconMenuTrigger from '../IconMenuTrigger.vue';

type ProfileDialog = 'new' | 'rename';

export default Vue.extend({
  name: 'TheStyleEditorPage',

  components: {
    SToggleSwitch,
    CheckIcon,
    ChevronLeftIcon,
    SText,
    SButton,
    SAnchoredMenu,
    SMenu,
    SMenuItem,
    SConfirmDialog,
    SPromptDialog,
    StyleRowMenu,
    CodeEditor,
    IconMenuTrigger,
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
    selectedProfile: string;
    // Unsaved css per profile id.
    drafts: Record<string, string>;
    dialog: ProfileDialog | null;
    showDeleteProfileConfirm: boolean;
    showDeleteConfirm: boolean;
    showLeaveConfirm: boolean;
    showReplaceConfirm: boolean;
    leaving: boolean;
    pendingNext: NavigationGuardNext | null;
  } {
    const existing = this.$store.state.styles[this.initialUrl];

    return {
      url: this.initialUrl,
      selectedProfile: existing
        ? expandProfiles(existing).active
        : DEFAULT_PROFILE_ID,
      drafts: {},
      dialog: null,
      showDeleteProfileConfirm: false,
      showDeleteConfirm: false,
      showLeaveConfirm: false,
      showReplaceConfirm: false,
      leaving: false,
      pendingNext: null,
    };
  },

  computed: {
    existingStyle(): StyleWithoutUrl | undefined {
      return this.$store.state.styles[this.initialUrl];
    },

    expanded(): ExpandedProfiles {
      return this.existingStyle
        ? expandProfiles(this.existingStyle)
        : {
            active: DEFAULT_PROFILE_ID,
            sheets: { [DEFAULT_PROFILE_ID]: { name: '', css: '' } },
          };
    },

    activeProfile(): string {
      return this.expanded.active;
    },

    profileIds(): Array<string> {
      return Object.keys(this.expanded.sheets);
    },

    selectedName(): string {
      return this.profileName(this.selectedProfile);
    },

    dialogTitle(): string {
      return this.dialog === 'rename'
        ? this.t('rename_profile')
        : this.t('create_profile');
    },

    css: {
      get(): string {
        return (
          this.drafts[this.selectedProfile] ??
          this.expanded.sheets[this.selectedProfile]?.css ??
          ''
        );
      },
      set(css: string): void {
        this.$set(this.drafts, this.selectedProfile, css);
      },
    },

    changedDrafts(): Record<string, string> {
      const changed: Record<string, string> = {};

      for (const [id, css] of Object.entries(this.drafts)) {
        const sheet = this.expanded.sheets[id];

        if (sheet && sheet.css !== css) {
          changed[id] = css;
        }
      }

      return changed;
    },

    isDirty(): boolean {
      return (
        this.url !== this.initialUrl ||
        Object.keys(this.changedDrafts).length > 0
      );
    },

    lineCount(): number {
      return this.css.length ? this.css.split('\n').length : 0;
    },

    lineCountLabel(): string {
      return `${this.lineCount} line${this.lineCount === 1 ? '' : 's'}`;
    },

    ruleCount(): number | null {
      return countRules(this.css);
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
      return (
        this.url.trim().length > 0 &&
        Object.values(this.changedDrafts).every(css => countRules(css) !== null)
      );
    },
  },

  watch: {
    profileIds(ids: Array<string>): void {
      if (!ids.includes(this.selectedProfile)) {
        this.selectedProfile = this.activeProfile;
      }
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

    confirmReplace(): void {
      this.showReplaceConfirm = false;
      this.emitSave();
    },

    confirmDelete(): void {
      this.$store.dispatch('deleteStyle', this.initialUrl);
      this.showDeleteConfirm = false;
      this.leaving = true;
      this.$emit('back');
    },

    profileName(id: string): string {
      return this.expanded.sheets[id]?.name || this.t('profile_default_name');
    },

    validateProfileName(name: string): string {
      const taken = this.profileIds.some(
        id =>
          (this.dialog !== 'rename' || id !== this.selectedProfile) &&
          this.profileName(id).toLowerCase() === name.toLowerCase()
      );

      return taken ? this.t('profile_name_taken') : '';
    },

    onProfileDialogConfirm(name: string): void {
      if (this.dialog === 'rename') {
        this.$store.dispatch('renameProfile', {
          url: this.initialUrl,
          id: this.selectedProfile,
          name,
        });
      } else {
        const id = crypto.randomUUID();

        this.$store.dispatch('createProfile', {
          url: this.initialUrl,
          id,
          name,
          css: '',
        });
        this.selectedProfile = id;
      }

      this.dialog = null;
    },

    /**
     * Copies the open tab, unsaved edits included, into a new profile
     * named after it, and opens that.
     */
    duplicateSelected(): void {
      const id = crypto.randomUUID();
      const base = this.t('name_copy', [this.selectedName]);
      const taken = new Set(
        this.profileIds.map(other => this.profileName(other).toLowerCase())
      );
      let name = base;

      for (let n = 2; taken.has(name.toLowerCase()); n++) {
        name = `${base} ${n}`;
      }

      this.$store.dispatch('createProfile', {
        url: this.initialUrl,
        id,
        name,
        css: this.css,
      });
      this.selectedProfile = id;
    },

    useSelectedProfile(): void {
      this.$store.dispatch('setActiveProfile', {
        url: this.initialUrl,
        id: this.selectedProfile,
      });
    },

    confirmDeleteProfile(): void {
      const id = this.selectedProfile;

      this.$store.dispatch('deleteProfile', { url: this.initialUrl, id });
      this.$delete(this.drafts, id);
      this.showDeleteProfileConfirm = false;
    },

    save(): void {
      if (this.url !== this.initialUrl && this.$store.state.styles[this.url]) {
        this.showReplaceConfirm = true;
        return;
      }

      this.emitSave();
    },

    emitSave(): void {
      this.leaving = true;
      this.$emit('save', {
        initialUrl: this.initialUrl,
        url: this.url,
        drafts: this.existingStyle
          ? this.changedDrafts
          : { [DEFAULT_PROFILE_ID]: this.css },
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
  gap: 16px;
  padding: 16px 16px 14px 20px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  font-size: 12px;
  line-height: 1;
  color: var(--text-muted);
  text-decoration: none;

  &:hover {
    color: var(--text-body);
  }

  @include focus-ring(2px);
}

.url-input {
  @include button-reset;
  @include truncate;

  display: block;
  width: 100%;
  font-weight: 600;
  font-size: 15px;
  line-height: 1.2;
  color: var(--text-primary);

  &::placeholder {
    font-weight: 400;
    color: var(--text-muted);
  }
}

.switch.enabled-toggle {
  flex: none;
  width: auto;
  gap: 8px;

  ::v-deep .label {
    order: -1;
  }
}

.profile-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px 0 14px;
  border-bottom: 1px solid var(--panel-border);
}

.profile-tabs {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.profile-tab {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  height: 34px;
  padding: 0 8px;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }

  &.selected {
    font-weight: 500;
    color: var(--text-primary);
    border-bottom-color: var(--accent);
  }

  @include focus-ring;
}

.create-button {
  font-size: 13px;
  font-weight: 400;
}

.tab-check {
  color: var(--accent-text);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.editor-code-area {
  flex: 1;
  min-height: 0;
  background: var(--code-surface);
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
