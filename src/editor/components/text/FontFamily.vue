<template>
  <property-row :label="t('font_family')">
    <s-autocomplete
      v-model="draft"
      chips
      select-on-focus
      blur-on-commit
      class="font-family-autocomplete"
      :items="rows"
      :disabled="disabled"
      :min-width="184"
      :placeholder="t('default')"
      :chip-label="unquoteFamily"
      @select="pick"
      @submit="submit($event, true)"
      @leave="submit"
      @cancel="clearPreview"
    >
      <template #item="{ item, select }">
        <menu-item
          class="font-row"
          :class="{ 'font-link': item.kind === 'link' }"
          :selected="item.kind !== 'link' && item.value === value"
          @click="select"
          @mouseenter.native="preview(item)"
          @focus.native="preview(item)"
        >
          <span class="font-row-label">{{ label(item) }}</span>
          <external-link-icon v-if="item.kind === 'link'" />
          <span v-else-if="item.category" class="font-row-category">
            {{ item.category }}
          </span>
        </menu-item>
      </template>
    </s-autocomplete>
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

import { SAutocomplete, MenuItem } from '@stylebot/components';
import { ExternalLinkIcon } from '@stylebot/icons';
import { unquoteFamily } from '@stylebot/css';
import { debounce, Debounced } from '@stylebot/utils';
import {
  FontSuggestion,
  GoogleFont,
  loadGoogleFonts,
  suggestFonts,
} from '@stylebot/google-fonts';

import PropertyRow from '../basic/PropertyRow.vue';
import { openGoogleFontsPage } from '../../utils/chrome';

type Row = FontSuggestion | { kind: 'link'; value: '' };

const BROWSE_ROW: Row = { kind: 'link', value: '' };
const PREVIEW_DELAY = 150;

export default Vue.extend({
  name: 'FontFamily',

  components: {
    SAutocomplete,
    MenuItem,
    ExternalLinkIcon,
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
      const activeRule = this.$store.getters.activeRule;
      let value = '';

      if (activeRule) {
        activeRule.clone().walkDecls('font-family', (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value;
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },

    rows(): Array<Row> {
      const suggestions = suggestFonts(
        this.draft,
        this.value,
        this.$store.state.options.fonts,
        this.googleFonts
      );

      return [...suggestions, BROWSE_ROW];
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

    label(row: Row): string {
      switch (row.kind) {
        case 'default':
          return this.t('default');
        case 'custom':
          return this.t('use_font', [row.value]);
        case 'link':
          return this.t('browse_google_fonts');
        default:
          return row.family;
      }
    },

    apply(value: string, remember: boolean): void {
      this.previewFont.cancel();
      this.$store.dispatch('applyFontFamily', { value, remember });
    },

    pick(row: Row): void {
      if (row.kind === 'link') {
        // The panel goes away with the focused row, so no leave follows:
        // drop any typed text rather than leave it on show unapplied.
        this.draft = this.value;
        this.clearPreview();
        openGoogleFontsPage();
      } else {
        this.apply(row.value, true);
      }
    },

    // Enter applies the text as typed and remembers it; leaving the field
    // applies it too, but a half-typed name isn't worth remembering. When
    // it's already the applied value there's nothing to apply, so any
    // preview goes.
    submit(text: string, remember = false): void {
      const value = text.trim();

      if (value !== this.value) {
        this.apply(value, remember);
      } else {
        this.clearPreview();
      }
    },

    preview(row: Row): void {
      if (row.kind !== 'link') {
        this.previewFont(row.value);
      }
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
  flex: 0 1 236px;
  min-width: 0;
}

.font-family-autocomplete ::v-deep .anchored-menu-panel {
  left: 0;
}

.font-family-autocomplete ::v-deep .autocomplete-menu {
  width: 100%;
}

.font-row ::v-deep .menu-item-content {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.font-row-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.font-row-category {
  flex: none;
  font-size: 10.5px;
  color: var(--text-muted);
}

.font-link {
  margin-top: 3px;
  border-top: 1px solid var(--panel-border);
  color: var(--accent);

  svg {
    flex: none;
  }
}
</style>
