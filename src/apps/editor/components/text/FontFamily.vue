<template>
  <property-row :label="t('font_family')" property="font-family">
    <s-autocomplete
      v-model="draft"
      menu-size="small"
      chips
      select-on-focus
      blur-on-commit
      class="font-family-autocomplete"
      :items="items"
      :disabled="disabled"
      :min-width="184"
      :placeholder="placeholder"
      :chip-label="unquoteFamily"
      @select="pick"
      @submit="submit($event, true)"
      @leave="submit"
      @cancel="cancel"
      @menu-leave="clearPreview"
      @input="pickedCategory = null"
    >
      <template #chips="{ parts }">
        <s-inline-list :parts="parts" />
      </template>

      <template #header>
        <font-categories
          v-if="!query || category"
          :active="category"
          @browse="browse"
          @mouseenter.native="clearPreview"
        />
      </template>

      <template #item="{ item, select }">
        <div v-if="item.kind === 'heading'" class="font-heading">
          {{ item.label }}
        </div>

        <s-menu-item
          v-else
          class="font-row"
          :selected="item.value === value"
          @click="select"
          @mouseenter.native="preview(item)"
          @focus.native="preview(item)"
        >
          <span class="font-row-label">
            <span
              v-for="(part, index) in labelParts(item)"
              :key="index"
              :class="{ 'font-row-match': part.match }"
              v-text="part.text"
            />
          </span>

          <span v-if="item.kind === 'custom'" class="font-row-note">
            {{
              item.available
                ? t('on_this_computer')
                : t('not_found_on_this_computer')
            }}
          </span>
        </s-menu-item>
      </template>
    </s-autocomplete>
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';

import { SAutocomplete, SInlineList, SMenuItem } from '@stylebot/components';
import {
  getDeclarationValue,
  getPrimaryFontFamily,
  unquoteFamily,
} from '@stylebot/css';
import type { Debounced } from '@stylebot/utils';
import { debounce } from '@stylebot/utils';
import type {
  FontHeading,
  FontSuggestion,
  GoogleFont,
  GoogleFontCategory,
} from '@stylebot/google-fonts';
import {
  allFonts,
  categoryFonts,
  getFontCategory,
  groupFontRows,
  isDefaultFont,
  isFontAvailable,
  loadGoogleFonts,
  suggestFonts,
} from '@stylebot/google-fonts';

import FontCategories from './FontCategories.vue';
import PropertyRow from '../basic/PropertyRow.vue';
import { computedFontPlaceholder } from '../../utils/computed-placeholder';

type Row = FontSuggestion & { available?: boolean };

/**
 * Notes on the row for the typed text whether its font is on this computer.
 */
const withAvailability = (row: FontSuggestion): Row => {
  if (row.kind !== 'custom') {
    return row;
  }

  const family = unquoteFamily(getPrimaryFontFamily(row.value));

  return { ...row, available: isFontAvailable(family) };
};

const PREVIEW_DELAY = 150;

export default Vue.extend({
  name: 'FontFamily',

  components: {
    FontCategories,
    SAutocomplete,
    SInlineList,
    SMenuItem,
    PropertyRow,
  },

  data(): {
    draft: string;
    pickedCategory: GoogleFontCategory | null;
    googleFonts: Array<GoogleFont>;
    previewFont: Debounced<[string]>;
  } {
    return {
      draft: '',
      // The category picked in the menu, listed in full until the text is
      // edited or the menu closes; the text itself is left alone. Null is
      // All: every font.
      pickedCategory: null,
      googleFonts: [],
      // Hovering or arrowing through rows previews them on the page, but
      // not so eagerly that sweeping the list loads every font.
      previewFont: debounce(
        value => this.$store.dispatch('previewFontFamily', value),
        PREVIEW_DELAY
      ),
    };
  },

  computed: {
    value(): string {
      return getDeclarationValue(this.$store.getters.activeRule, 'font-family');
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },

    otherRule(): { selector: string; value: string } | null {
      return this.$store.getters.setByOtherSelector['font-family'] ?? null;
    },

    placeholder(): string {
      const family = this.otherRule
        ? unquoteFamily(getPrimaryFontFamily(this.otherRule.value))
        : computedFontPlaceholder(this.$store.state.computedStyles);

      return family || this.t('default');
    },

    // The family being typed, which matching rows show in bold.
    query(): string {
      if (this.draft === this.value) {
        return '';
      }

      return this.draft.split(',').pop()?.trim().toLowerCase() ?? '';
    },

    // The category the menu lists in full: the one picked in the strip, or
    // the one the typed text names ("serif", "mono").
    category(): GoogleFontCategory | null {
      if (this.pickedCategory) {
        return this.pickedCategory;
      }

      return this.query ? getFontCategory(this.query) : null;
    },

    recents(): Array<string> {
      return this.$store.state.options.fonts;
    },

    // Before anything is typed, every Google Font follows the recents.
    rows(): Array<Row> {
      if (this.pickedCategory) {
        return categoryFonts(this.pickedCategory, this.googleFonts);
      }

      const suggestions = suggestFonts(
        this.draft,
        this.value,
        this.recents,
        this.googleFonts,
        this.t('default')
      );
      const more = this.query ? [] : allFonts(this.googleFonts, this.recents);

      return [...suggestions, ...more].map(withAvailability);
    },

    items(): Array<Row | FontHeading> {
      return groupFontRows(this.rows, this.recents, {
        recent: this.t('recent'),
        google: this.t('google_fonts'),
      });
    },
  },

  watch: {
    value: {
      immediate: true,
      handler(value: string): void {
        this.draft = value;
      },
    },
  },

  mounted() {
    loadGoogleFonts().then(fonts => {
      this.googleFonts = fonts;
    });
  },

  beforeDestroy() {
    this.previewFont.cancel();
  },

  methods: {
    unquoteFamily,

    // Lists a category's Google Fonts, or every font for All (null). The
    // page drops any preview, whose font the new list may not have.
    browse(category: GoogleFontCategory | null): void {
      this.pickedCategory = category;
      this.draft = this.value;
      this.clearPreview();

      // The new list starts from its most popular fonts, not the old one's
      // scroll position.
      this.$nextTick(() => {
        this.$el.querySelector('.autocomplete-menu')?.scrollTo({ top: 0 });
      });
    },

    labelParts(row: Row): Array<{ text: string; match: boolean }> {
      const text = this.label(row);
      const start =
        row.kind === 'font' && this.query
          ? text.toLowerCase().indexOf(this.query)
          : -1;

      if (start < 0) {
        return [{ text, match: false }];
      }

      const end = start + this.query.length;
      return [
        { text: text.slice(0, start), match: false },
        { text: text.slice(start, end), match: true },
        { text: text.slice(end), match: false },
      ].filter(part => part.text);
    },

    label(row: Row): string {
      switch (row.kind) {
        case 'default':
          return this.t('default');
        case 'custom':
          return this.t('use_font', [row.value]);
        default:
          return row.family;
      }
    },

    apply(value: string, remember: boolean): void {
      this.pickedCategory = null;
      this.previewFont.cancel();
      this.$store.dispatch('applyFontFamily', { value, remember });
    },

    pick(row: Row): void {
      this.apply(row.value, true);
    },

    // Enter applies the text as typed and remembers it; leaving the field
    // applies it too, but a half-typed name isn't worth remembering. When
    // it's already the applied value there's nothing to apply, so any
    // preview goes. Typing the Default choice's name picks the default.
    submit(text: string, remember = false): void {
      this.pickedCategory = null;

      const value = isDefaultFont(text, this.t('default')) ? '' : text.trim();

      if (value !== this.value) {
        this.apply(value, remember);
      } else {
        this.clearPreview();
      }
    },

    // Escape backs out of the edit: the typed text goes along with any
    // preview. Clicking away only drops the preview, as leaving applies.
    cancel(reason: 'escape' | 'outside'): void {
      this.pickedCategory = null;

      if (reason === 'escape') {
        this.draft = this.value;
      }

      this.clearPreview();
    },

    // The Default row previews the page's own font by clearing any other.
    preview(row: Row): void {
      this.previewFont(row.value);
    },

    clearPreview(): void {
      this.previewFont.cancel();
      this.$store.dispatch('previewFontFamily', '');
    },
  },
});
</script>

<style lang="scss" scoped>
.property-row ::v-deep .property-row-control {
  flex: 0 1 176px;
  min-width: 0;
}

.font-family-autocomplete ::v-deep .autocomplete-menu {
  width: 284px;
  scroll-padding-top: 40px;
}

.font-row-label {
  @include truncate;

  display: block;
  min-width: 0;
  color: var(--field-ink);
}

.font-row-match {
  font-weight: 600;
}

.font-row-note {
  @include truncate;

  flex: none;
  margin-left: auto;
  font-size: 11px;
  color: var(--text-faint);
}

.font-heading {
  padding: 8px 10px 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-faint);
}
</style>
