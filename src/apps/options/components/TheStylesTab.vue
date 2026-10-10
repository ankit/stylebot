<template>
  <div class="styles-tab">
    <div class="header">
      <div class="title-block">
        <s-heading as="h1" size="xl">{{ t('styles_options') }}</s-heading>
        <s-text variant="muted" class="subtitle">
          {{
            t(totalCount === 1 ? 'sites_count_one' : 'sites_count_other', [
              String(totalCount),
            ])
          }}
          ·
          {{ t('enabled_count', [String(enabledCount)]) }}
        </s-text>
      </div>

      <s-button variant="primary" @click="$emit('edit', '')">
        {{ t('add_a_style') }}
      </s-button>
    </div>

    <div class="search-row">
      <label class="search">
        <search-icon />
        <input
          v-model="urlFilter"
          type="text"
          :placeholder="t('search_sites')"
        />
      </label>

      <styles-bulk-menu
        @enable-all="enableAll"
        @disable-all="disableAll"
        @delete-all="showDeleteAllConfirm = true"
      />
    </div>

    <s-list v-if="styles.length" class="list">
      <style-list-row
        v-for="style in styles"
        :key="style.url"
        :url="style.url"
        :modified-time="style.modifiedTime"
        :enabled="style.enabled"
        :profile-count="profileCount(style)"
        @edit="$emit('edit', $event)"
        @toggle="toggleStyle(style)"
        @delete="deleteStyle(style)"
      />
    </s-list>

    <s-text v-else-if="urlFilter" variant="muted" class="empty">
      {{ t('no_sites_match') }}
    </s-text>

    <s-confirm-dialog
      v-if="showDeleteAllConfirm"
      :title="t('delete_all_styles_question')"
      :message="t('delete_all_warning', [String(totalCount)])"
      :confirm-label="t('delete_all')"
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

import type { Style } from '@stylebot/types';
import {
  SHeading,
  SText,
  SButton,
  SConfirmDialog,
  SList,
} from '@stylebot/components';
import { SearchIcon } from '@stylebot/icons';
import { listProfiles } from '@stylebot/saved-styles';

import StyleListRow from './styles/StyleListRow.vue';
import StylesBulkMenu from './styles/StylesBulkMenu.vue';

export default Vue.extend({
  name: 'TheStylesTab',

  components: {
    SHeading,
    SText,
    SButton,
    SConfirmDialog,
    SList,
    SearchIcon,
    StyleListRow,
    StylesBulkMenu,
  },

  data(): {
    urlFilter: string;
    showDeleteAllConfirm: boolean;
  } {
    return {
      urlFilter: '',
      showDeleteAllConfirm: false,
    };
  },

  computed: {
    allStyles(): Array<Style> {
      const stylesObj = this.$store.state.styles;
      const styles: Array<Style> = [];

      for (const url in stylesObj) {
        styles.push({ url, ...stylesObj[url] });
      }

      return styles;
    },

    styles(): Array<Style> {
      const query = this.urlFilter.trim().toLowerCase();
      const styles = this.allStyles.filter(style =>
        style.url.toLowerCase().includes(query)
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
  },

  methods: {
    profileCount(style: Style): number {
      return listProfiles(style).length;
    },

    deleteStyle(style: Style): void {
      this.$store.dispatch('deleteStyle', style.url);
    },

    toggleStyle(style: Style): void {
      this.$store.dispatch(
        style.enabled ? 'disableStyle' : 'enableStyle',
        style.url
      );
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
  max-width: 860px;
  padding: 20px 22px 26px;
}

.header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.title-block {
  flex: 1;
  min-width: 0;
}

.subtitle {
  margin-top: 8px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
}

.search {
  @include field-border(8px);

  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  box-sizing: border-box;
  color: var(--text-faint);
  cursor: text;

  &:focus-within {
    @include field-active-border;
  }

  input {
    @include button-reset;

    flex: 1;
    min-width: 0;
    font-size: 14px;
    line-height: 1.2;
    color: var(--text-primary);

    &::placeholder {
      color: var(--field-placeholder);
    }
  }
}

.list {
  margin-top: 16px;
}

.empty {
  margin-top: 32px;
  text-align: center;
}
</style>
