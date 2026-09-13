<template>
  <div class="spacing-control" :class="{ last }">
    <property-row :label="label" last>
      <s-segmented-control fit :value="mode" :options="modeOptions" @change="selectMode" />
    </property-row>

    <div v-if="mode === 'all'" class="spacing-grid">
      <spacing-field :label="t('all')" :value="all" :disabled="disabled" @input="setAll" />
    </div>

    <div v-else-if="mode === 'xy'" class="spacing-grid">
      <spacing-field :label="t('vertical')" :value="vertical" :disabled="disabled" @input="setVertical" />
      <spacing-field :label="t('horizontal')" :value="horizontal" :disabled="disabled" @input="setHorizontal" />
    </div>

    <div v-else-if="mode === 'individual'" class="spacing-grid">
      <spacing-field :label="t('top')" :value="top" :disabled="disabled" @input="setSide('top', $event)" />
      <spacing-field :label="t('right')" :value="right" :disabled="disabled" @input="setSide('right', $event)" />
      <spacing-field :label="t('bottom')" :value="bottom" :disabled="disabled" @input="setSide('bottom', $event)" />
      <spacing-field :label="t('left')" :value="left" :disabled="disabled" @input="setSide('left', $event)" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { Declaration } from 'postcss';
import { t } from '@stylebot/i18n';
import { SSegmentedControl } from '@stylebot/components';

import PropertyRow from '../basic/PropertyRow.vue';
import SpacingField from './SpacingField.vue';
import { Side, Sides, parseLength, expandShorthand, resolveSpacingDeclarations } from '../../utils/spacing';

type Mode = 'none' | 'all' | 'xy' | 'individual';

export default Vue.extend({
  name: 'SpacingControl',

  components: {
    PropertyRow,
    SSegmentedControl,
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

    // Drops the bottom divider when this is the last control in a card.
    last: {
      type: Boolean,
      default: false,
    },
  },

  data(): { mode: Mode } {
    return {
      mode: 'none',
    };
  },

  computed: {
    modeOptions(): Array<{ value: Mode; label: string }> {
      return [
        { value: 'none', label: t('none') },
        { value: 'all', label: t('all') },
        { value: 'xy', label: t('x_and_y') },
        { value: 'individual', label: t('individual') },
      ];
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

      activeRule.clone().walkDecls((decl: Declaration) => {
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
      return this.top === this.right && this.right === this.bottom && this.bottom === this.left
        ? this.top
        : '';
    },

    vertical(): string {
      return this.top === this.bottom ? this.top : '';
    },

    horizontal(): string {
      return this.left === this.right ? this.left : '';
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

      if (!top && !right && !bottom && !left) {
        return 'none';
      }

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

      if (mode === 'none') {
        this.setAll('');
      }
    },

    applySides(sides: Sides): void {
      resolveSpacingDeclarations(sides, this.properties, this.shorthandProperty).forEach(
        ({ property, value }) => {
          this.$store.dispatch('applyDeclaration', { property, value });
        }
      );
    },

    setAll(length: string): void {
      this.applySides({ top: length, right: length, bottom: length, left: length });
    },

    setVertical(length: string): void {
      this.applySides({ top: length, right: this.right, bottom: length, left: this.left });
    },

    setHorizontal(length: string): void {
      this.applySides({ top: this.top, right: length, bottom: this.bottom, left: length });
    },

    setSide(side: Side, length: string): void {
      const sides = { top: this.top, right: this.right, bottom: this.bottom, left: this.left };
      this.applySides({ ...sides, [side]: length });
    },
  },
});
</script>

<style lang="scss" scoped>
.spacing-control {
  padding-bottom: 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--foreground) 7%, transparent);

  &.last {
    padding-bottom: 2px;
    border-bottom: none;
  }
}

.spacing-grid {
  display: flex;
  flex-wrap: wrap;
  row-gap: 8px;
  column-gap: 12px;
  padding-top: 8px;
}

.spacing-grid ::v-deep .spacing-field {
  flex: 1 1 120px;
}
</style>
