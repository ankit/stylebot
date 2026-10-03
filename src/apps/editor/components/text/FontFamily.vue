<template>
  <property-row :label="t('font_family')" property="font-family">
    <s-autocomplete
      v-model="draft"
      chips
      select-on-focus
      blur-on-commit
      class="font-family-autocomplete"
      :items="rows"
      :disabled="disabled"
      :min-width="184"
      :placeholder="placeholder"
      :chip-label="unquoteFamily"
      @select="pick"
      @submit="submit($event, true)"
      @leave="submit"
      @cancel="cancel"
    >
      <template #chips="{ parts }">
        <s-inline-list :parts="parts" />
      </template>

      <template #item="{ item, select }">
        <s-menu-item
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
import type { FontSuggestion, GoogleFont } from '@stylebot/google-fonts';
import {
  isDefaultFont,
  loadGoogleFonts,
  suggestFonts,
} from '@stylebot/google-fonts';

import PropertyRow from '../basic/PropertyRow.vue';
import { computedFontPlaceholder } from '../../utils/computed-placeholder';

type Row = FontSuggestion;

const PREVIEW_DELAY = 150;

export default Vue.extend({
  name: 'FontFamily',

  components: {
    SAutocomplete,
    SInlineList,
    SMenuItem,
    PropertyRow,
  },

  data(): {
    draft: string;
    googleFonts: Array<GoogleFont>;
    previewFont: Debounced<[string]>;
  } {
    return {
      draft: '',
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

    rows(): Array<Row> {
      return suggestFonts(
        this.draft,
        this.value,
        this.$store.state.options.fonts,
        this.googleFonts,
        this.t('default')
      );
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
  width: 100%;
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
</style>
