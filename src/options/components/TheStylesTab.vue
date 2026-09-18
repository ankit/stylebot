<template>
  <div class="styles-tab">
    <div class="header">
      <div class="title-block">
        <heading as="h1">{{ t('styles_options') }}</heading>
        <s-text variant="muted" class="subtitle">
          {{ t(totalCount === 1 ? 'sites_count_one' : 'sites_count_other', [String(totalCount)]) }} ·
          {{ t('enabled_count', [String(enabledCount)]) }}
        </s-text>
      </div>

      <s-button @click="$emit('edit', '')">{{ t('add_a_style') }}</s-button>
    </div>

    <div class="search-row">
      <div class="search">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <circle cx="7" cy="7" r="4.3" />
          <path d="M10.2 10.2 13.5 13.5" />
        </svg>
        <input v-model="urlFilter" type="text" :placeholder="t('search_sites')" />
      </div>

      <button
        v-if="readabilityCount > 0"
        type="button"
        class="filter-chip"
        :class="{ active: readabilityOnly }"
        :aria-pressed="String(readabilityOnly)"
        @click="readabilityOnly = !readabilityOnly"
      >
        {{ t('readability') }} ({{ readabilityCount }})
      </button>

      <styles-bulk-menu @enable-all="enableAll" @disable-all="disableAll" @delete-all="showDeleteAllConfirm = true" />
    </div>

    <div class="list">
      <style-list-row
        v-for="style in styles"
        :key="style.url"
        :css="style.css"
        :url="style.url"
        :modified-time="style.modifiedTime"
        :enabled="style.enabled"
        :readability="style.readability"
        @edit="$emit('edit', $event)"
        @toggle="toggleStyle(style)"
        @toggle-readability="turnOffReadability(style)"
        @delete="deleteStyle(style)"
      />
    </div>

    <confirm-dialog
      v-if="showDeleteAllConfirm"
      :title="t('delete_all_styles')"
      :message="t('delete_all_warning')"
      :confirm-label="t('delete_all_styles')"
      @cancel="showDeleteAllConfirm = false"
      @confirm="
        showDeleteAllConfirm = false;
        deleteAll();
      "
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { compareAsc } from 'date-fns';

import { Style } from '@stylebot/types';
import { Heading, SText, SButton, ConfirmDialog } from '@stylebot/components';

import StyleListRow from './styles/StyleListRow.vue';
import StylesBulkMenu from './styles/StylesBulkMenu.vue';

export default Vue.extend({
  name: 'TheStylesTab',

  components: {
    Heading,
    SText,
    SButton,
    ConfirmDialog,
    StyleListRow,
    StylesBulkMenu,
  },

  data(): {
    urlFilter: string;
    readabilityOnly: boolean;
    showDeleteAllConfirm: boolean;
  } {
    return {
      urlFilter: '',
      readabilityOnly: false,
      showDeleteAllConfirm: false,
    };
  },

  computed: {
    allStyles(): Array<Style> {
      const stylesObj = this.$store.state.styles;
      const styles: Array<Style> = [];

      for (const url in stylesObj) {
        styles.push({
          url,
          css: stylesObj[url].css,
          enabled: stylesObj[url].enabled,
          readability: stylesObj[url].readability,
          modifiedTime: stylesObj[url].modifiedTime,
        });
      }

      return styles;
    },

    styles(): Array<Style> {
      const styles = this.allStyles.filter(
        style =>
          style.url.indexOf(this.urlFilter) !== -1 &&
          (!this.readabilityOnly || style.readability)
      );

      styles.sort((s1, s2) =>
        compareAsc(new Date(s2.modifiedTime), new Date(s1.modifiedTime))
      );

      return styles;
    },

    totalCount(): number {
      return this.allStyles.length;
    },

    enabledCount(): number {
      return this.allStyles.filter(style => style.enabled).length;
    },

    readabilityCount(): number {
      return this.allStyles.filter(style => style.readability).length;
    },
  },

  methods: {
    deleteStyle(style: Style): void {
      this.$store.dispatch('deleteStyle', style.url);
    },

    toggleStyle(style: Style): void {
      this.$store.dispatch(style.enabled ? 'disableStyle' : 'enableStyle', style.url);
    },

    turnOffReadability(style: Style): void {
      this.$store.dispatch('setStyleReadability', {
        url: style.url,
        value: false,
      });
    },

    enableAll(): void {
      this.$store.dispatch('enableAllStyles');
    },

    disableAll(): void {
      this.$store.dispatch('disableAllStyles');
    },

    deleteAll(): void {
      this.$store.dispatch('deleteAllStyles');
    },
  },
});
</script>

<style lang="scss" scoped>
.styles-tab {
  max-width: 760px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px 16px;
}

.title-block {
  flex: 1;
  min-width: 0;
}

.subtitle {
  margin-top: 3px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px 14px;
}

.search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  border-radius: 9px;
  background: var(--accent);
  border: 1px solid var(--border);
  color: var(--muted-foreground);

  input {
    all: unset;
    flex: 1;
    min-width: 0;
    font-weight: 400;
    font-size: 13px;
    line-height: 1.2;
    color: var(--foreground);

    &::placeholder {
      color: var(--muted-foreground);
    }
  }
}

.filter-chip {
  all: unset;
  box-sizing: border-box;
  flex: none;
  padding: 9px 13px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--accent);
  font-weight: 500;
  font-size: 13px;
  line-height: 1.2;
  color: var(--muted-foreground);
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: var(--foreground);
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }

  &.active {
    background: var(--active);
    border-color: color-mix(in srgb, var(--foreground) 22%, var(--border));
    color: var(--foreground);
  }
}

.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid var(--border);
}
</style>
