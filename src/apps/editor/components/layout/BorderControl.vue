<template>
  <div class="border-rows">
    <property-row :label="t('style')">
      <div class="border-control">
        <s-select
          menu-size="small"
          class="border-style"
          :text="text"
          :muted="!styleValue"
          :disabled="disabled"
          :menu-min-width="160"
        >
          <template #default="{ close }">
            <s-menu-item
              v-for="option in options"
              :key="option.value"
              :selected="option.value === styleValue"
              @click="
                selectStyle(option.value);
                close();
              "
            >
              <span class="border-style-option">
                <span
                  class="border-style-preview"
                  :style="{ borderBottomStyle: option.value }"
                />
                {{ option.title }}
              </span>
            </s-menu-item>
          </template>
        </s-select>

        <length
          :key="`width-${sidesKey}`"
          class="border-width"
          :property="longhand('width')"
          :mirror="mirror('width')"
          :fallback="shorthandValue"
        />
        <color-picker
          :key="`color-${sidesKey}`"
          class="border-color"
          :property="longhand('color')"
          :mirror="mirror('color')"
          :fallback="shorthandValue"
        />
      </div>
    </property-row>

    <property-row :label="t('sides')">
      <border-sides-picker
        :value="sides"
        :disabled="disabled"
        @input="selectSides"
      />
    </property-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { t } from '@stylebot/i18n';
import { SSelect, SMenuItem } from '@stylebot/components';
import { getDeclarationValue } from '@stylebot/css';

import type { Declaration } from 'postcss';

import PropertyRow from '../basic/PropertyRow.vue';
import Length from '../Length.vue';
import ColorPicker from '../color/ColorPicker.vue';
import BorderSidesPicker from './BorderSidesPicker.vue';
import type { Side } from '../../utils/spacing';
import {
  extractBorderStyle,
  extractColor,
  extractLength,
} from '../../utils/css-value';
import { computedKeywordPlaceholder } from '../../utils/computed-placeholder';

type BorderPart = 'style' | 'width' | 'color';

const SIDES: Array<Side> = ['top', 'right', 'bottom', 'left'];
const ALL_SIDES_PROPERTIES = [
  'border',
  'border-style',
  'border-width',
  'border-color',
];
const SIDE_PROPERTY = /^border-(top|right|bottom|left)(-(style|width|color))?$/;

export default Vue.extend({
  name: 'BorderControl',

  components: {
    PropertyRow,
    SSelect,
    SMenuItem,
    Length,
    ColorPicker,
    BorderSidesPicker,
  },

  data(): {
    chosenSides: Array<Side> | null;
    options: Array<{
      title: string;
      value: string;
    }>;
  } {
    return {
      chosenSides: null,
      options: [
        { title: t('border_none'), value: 'none' },
        { title: t('border_solid'), value: 'solid' },
        { title: t('border_dotted'), value: 'dotted' },
        { title: t('border_dashed'), value: 'dashed' },
        { title: t('border_double'), value: 'double' },
        { title: t('border_groove'), value: 'groove' },
        { title: t('border_ridge'), value: 'ridge' },
        { title: t('border_inset'), value: 'inset' },
        { title: t('border_outset'), value: 'outset' },
      ],
    };
  },

  computed: {
    // The sides the rule already borders: all of them for any all-sides
    // declaration (or none at all), else whichever sides it names.
    ruleSides(): Array<Side> {
      const rule = this.$store.getters.activeRule;
      const named = new Set<Side>();
      let allSides = false;

      rule?.walkDecls((decl: Declaration) => {
        if (ALL_SIDES_PROPERTIES.includes(decl.prop)) {
          allSides = true;
        }

        const match = decl.prop.match(SIDE_PROPERTY);

        if (match) {
          named.add(match[1] as Side);
        }
      });

      return allSides || named.size === 0
        ? [...SIDES]
        : SIDES.filter(side => named.has(side));
    },

    sides(): Array<Side> {
      return this.chosenSides ?? this.ruleSides;
    },

    allSides(): boolean {
      return this.sides.length === SIDES.length;
    },

    // Remounts the width and color fields when the sides change, so a draft
    // typed for one set of sides isn't applied to another.
    sidesKey(): string {
      return this.sides.join('-');
    },

    // The shorthand that holds this side's value, e.g. 'border-bottom'.
    shorthandProperty(): string {
      return this.allSides ? 'border' : `border-${this.sides[0]}`;
    },

    // Raw value of the shorthand (e.g. '1px solid #44475a'), used to fall
    // back to when the specific longhand isn't declared.
    shorthandValue(): string {
      const rule = this.$store.getters.activeRule;

      return (
        getDeclarationValue(rule, this.shorthandProperty) ||
        getDeclarationValue(rule, 'border')
      );
    },

    styleValue(): string {
      let value = getDeclarationValue(
        this.$store.getters.activeRule,
        this.longhand('style')
      );
      if (!value && this.shorthandValue) {
        value = extractBorderStyle(this.shorthandValue);
      }

      return value;
    },

    // Unset, it shows the page's own border style, muted.
    text(): string {
      const value =
        this.styleValue ||
        computedKeywordPlaceholder(
          this.$store.state.computedStyles,
          this.longhand('style')
        );
      const option = this.options.find(o => o.value === value);
      return option ? option.title : t('default');
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  watch: {
    '$store.state.activeSelector'(): void {
      this.chosenSides = null;
    },
  },

  methods: {
    /**
     * The longhand for a part of the border on the first chosen side, or on
     * every side at once, e.g. 'border-bottom-width' or 'border-width'.
     */
    longhand(part: BorderPart): string {
      return this.allSides
        ? `border-${part}`
        : `border-${this.sides[0]}-${part}`;
    },

    mirror(part: BorderPart): Array<string> {
      return this.allSides
        ? []
        : this.sides.slice(1).map(side => `border-${side}-${part}`);
    },

    selectStyle(value: string): void {
      this.$store.dispatch(
        'applyDeclarations',
        [this.longhand('style'), ...this.mirror('style')].map(property => ({
          property,
          value,
        }))
      );
    },

    /**
     * Moves the border onto the picked sides: clears every border
     * declaration, then writes the current width, style and color as a
     * single `border`, or as each picked side's own longhands so later
     * edits change them in place.
     */
    selectSides(sides: Array<Side>): void {
      const rule = this.$store.getters.activeRule;
      const width =
        getDeclarationValue(rule, this.longhand('width')) ||
        extractLength(this.shorthandValue);
      const style = this.styleValue;
      const color =
        getDeclarationValue(rule, this.longhand('color')) ||
        extractColor(this.shorthandValue);
      const value = [width, style, color].filter(Boolean).join(' ');

      this.chosenSides = sides;

      if (!value) {
        return;
      }

      const cleared: Array<string> = [];
      rule?.walkDecls((decl: Declaration) => {
        if (
          ALL_SIDES_PROPERTIES.includes(decl.prop) ||
          SIDE_PROPERTY.test(decl.prop)
        ) {
          cleared.push(decl.prop);
        }
      });

      const parts: Array<[BorderPart, string]> = [
        ['width', width],
        ['style', style],
        ['color', color],
      ];
      const written =
        sides.length === SIDES.length
          ? [{ property: 'border', value }]
          : sides.flatMap(side =>
              parts
                .filter(([, part]) => part)
                .map(([name, part]) => ({
                  property: `border-${side}-${name}`,
                  value: part,
                }))
            );

      this.$store.dispatch('applyDeclarations', [
        ...cleared
          .filter(property => !written.some(w => w.property === property))
          .map(property => ({ property, value: '' })),
        ...written,
      ]);
    },
  },
});
</script>

<style lang="scss" scoped>
.border-rows {
  display: flex;
  flex-direction: column;
}

.border-control {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.border-style ::v-deep .select-trigger {
  min-width: 0;
  width: 96px;
}

.border-control .border-width {
  min-width: 0;
  width: 60px;
}

.border-color ::v-deep .color-field {
  justify-content: center;
  width: 28px;
  min-width: 0;
  padding: 0;
}

.border-style-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.border-style-preview {
  flex: none;
  width: 36px;
  height: 0;
  border-bottom: 3px solid var(--text-muted);
}

.border-color ::v-deep .color-hex {
  display: none;
}
</style>
