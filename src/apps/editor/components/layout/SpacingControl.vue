<template>
  <div class="spacing-control">
    <property-row :label="label">
      <div class="spacing-row" :class="`mode-${mode}`">
        <spacing-field
          v-for="(field, index) in inlineFields"
          :key="index"
          :prefix="field.prefix"
          :value="field.value"
          :placeholder="field.placeholder"
          :disabled="disabled"
          @input="field.set"
        />

        <s-select
          class="spacing-mode"
          full-width
          :text="modeText"
          :disabled="disabled"
          :menu-min-width="150"
        >
          <template #default="{ close }">
            <s-menu-item
              v-for="option in modeOptions"
              :key="option.value"
              :selected="option.value === mode"
              @click="
                selectMode(option.value);
                close();
              "
            >
              {{ option.label }}
            </s-menu-item>
          </template>
        </s-select>
      </div>
    </property-row>

    <div v-if="mode === 'individual'" class="spacing-grid">
      <spacing-field
        v-for="(field, index) in fields"
        :key="index"
        :prefix="field.prefix"
        :value="field.value"
        :placeholder="field.placeholder"
        :disabled="disabled"
        @input="field.set"
      />
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { Declaration } from 'postcss';
import { t } from '@stylebot/i18n';
import { SMenuItem, SSelect } from '@stylebot/components';

import PropertyRow from '../basic/PropertyRow.vue';
import SpacingField from './SpacingField.vue';
import { computedSides, sharedValue } from '../../utils/computed-placeholder';
import type { Side, Sides } from '../../utils/spacing';
import {
  parseLength,
  expandShorthand,
  resolveSpacingDeclarations,
} from '../../utils/spacing';

type Mode = 'all' | 'xy' | 'individual';
type SpacingFieldConfig = {
  prefix: string;
  value: string;
  placeholder: string;
  set: (length: string) => void;
};

export default Vue.extend({
  name: 'SpacingControl',

  components: {
    PropertyRow,
    SMenuItem,
    SSelect,
    SpacingField,
  },

  props: {
    label: {
      type: String,
      required: true,
    },

    // Maps each side to the CSS property it controls, e.g.
    // { top: 'margin-top', right: 'margin-right', ... }.
    properties: {
      type: Object as PropType<Sides>,
      required: true,
    },
  },

  data(): { mode: Mode } {
    return {
      mode: 'all',
    };
  },

  computed: {
    modeOptions(): Array<{ value: Mode; label: string }> {
      return [
        { value: 'all', label: t('all_sides') },
        { value: 'xy', label: t('x_and_y') },
        { value: 'individual', label: t('individual') },
      ];
    },

    modeText(): string {
      return {
        all: t('all'),
        xy: t('x_and_y'),
        individual: t('sides'),
      }[this.mode];
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },

    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    // The shorthand property (e.g. 'padding') derived from the longhand
    // names, so a shorthand declaration is parsed into the same sides.
    shorthandProperty(): string {
      return this.properties.top.replace(/-top$/, '');
    },

    rawSides(): Sides {
      const sides: Sides = { top: '', right: '', bottom: '', left: '' };
      const activeRule = this.$store.getters.activeRule;

      if (!activeRule) {
        return sides;
      }

      activeRule.walkDecls((decl: Declaration) => {
        if (decl.prop === this.shorthandProperty) {
          const expanded = expandShorthand(decl.value);
          if (expanded) {
            Object.assign(sides, expanded);
          }
        } else {
          (Object.keys(this.properties) as Array<Side>).forEach(side => {
            if (decl.prop === this.properties[side]) {
              sides[side] = decl.value;
            }
          });
        }
      });

      return sides;
    },

    placeholders(): Sides & {
      all: string;
      vertical: string;
      horizontal: string;
    } {
      const sides = computedSides(
        this.$store.state.computedStyles,
        this.properties
      );

      return {
        ...sides,
        all: sharedValue(sides.top, sides.right, sides.bottom, sides.left),
        vertical: sharedValue(sides.top, sides.bottom),
        horizontal: sharedValue(sides.left, sides.right),
      };
    },

    top(): string {
      return parseLength(this.rawSides.top);
    },

    right(): string {
      return parseLength(this.rawSides.right);
    },

    bottom(): string {
      return parseLength(this.rawSides.bottom);
    },

    left(): string {
      return parseLength(this.rawSides.left);
    },

    all(): string {
      return this.top === this.right &&
        this.right === this.bottom &&
        this.bottom === this.left
        ? this.top
        : '';
    },

    vertical(): string {
      return this.top === this.bottom ? this.top : '';
    },

    horizontal(): string {
      return this.left === this.right ? this.left : '';
    },

    fields(): Array<SpacingFieldConfig> {
      const { placeholders } = this;

      switch (this.mode) {
        case 'all':
          return [
            {
              prefix: '',
              value: this.all,
              placeholder: placeholders.all,
              set: this.setAll,
            },
          ];
        case 'xy':
          return [
            {
              prefix: 'X',
              value: this.horizontal,
              placeholder: placeholders.horizontal,
              set: this.setHorizontal,
            },
            {
              prefix: 'Y',
              value: this.vertical,
              placeholder: placeholders.vertical,
              set: this.setVertical,
            },
          ];
        default:
          return (['top', 'right', 'bottom', 'left'] as Array<Side>).map(
            side => ({
              prefix: t(side).charAt(0).toUpperCase(),
              value: this[side],
              placeholder: placeholders[side],
              set: (length: string) => this.setSide(side, length),
            })
          );
      }
    },

    inlineFields(): Array<SpacingFieldConfig> {
      return this.mode === 'individual' ? [] : this.fields;
    },
  },

  watch: {
    activeSelector: {
      immediate: true,
      handler(): void {
        this.mode = this.deriveMode();
      },
    },
  },

  methods: {
    deriveMode(): Mode {
      const { top, right, bottom, left } = this;

      if (top === right && right === bottom && bottom === left) {
        return 'all';
      }

      if (top === bottom && left === right) {
        return 'xy';
      }

      return 'individual';
    },

    selectMode(mode: Mode): void {
      this.mode = mode;
    },

    applySides(sides: Sides): void {
      resolveSpacingDeclarations(
        sides,
        this.properties,
        this.shorthandProperty
      ).forEach(({ property, value }) => {
        this.$store.dispatch('applyDeclaration', { property, value });
      });
    },

    setAll(length: string): void {
      this.applySides({
        top: length,
        right: length,
        bottom: length,
        left: length,
      });
    },

    setVertical(length: string): void {
      this.applySides({
        top: length,
        right: this.right,
        bottom: length,
        left: this.left,
      });
    },

    setHorizontal(length: string): void {
      this.applySides({
        top: this.top,
        right: length,
        bottom: this.bottom,
        left: length,
      });
    },

    setSide(side: Side, length: string): void {
      const sides = {
        top: this.top,
        right: this.right,
        bottom: this.bottom,
        left: this.left,
      };
      this.applySides({ ...sides, [side]: length });
    },
  },
});
</script>

<style lang="scss" scoped>
.spacing-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.spacing-row .spacing-field {
  width: 76px;
}

.spacing-row.mode-all .spacing-field {
  width: 64px;
}

.spacing-mode {
  flex: none;
  width: 84px;
}

.spacing-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 2px 0 4px;
}
</style>
