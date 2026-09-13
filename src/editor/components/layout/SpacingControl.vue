<template>
  <div class="spacing-control" :class="{ last }">
    <property-row :label="label" last>
      <s-segmented-control fit :value="mode" :options="modeOptions" @change="selectMode" />
    </property-row>

    <div v-if="mode === 'all'" class="spacing-grid spacing-grid-1">
      <spacing-field :label="t('all')" :value="all" :disabled="disabled" @input="setAll" />
    </div>

    <div v-else-if="mode === 'xy'" class="spacing-grid spacing-grid-2">
      <spacing-field :label="t('vertical')" :value="vertical" :disabled="disabled" @input="setVertical" />
      <spacing-field :label="t('horizontal')" :value="horizontal" :disabled="disabled" @input="setHorizontal" />
    </div>

    <div v-else-if="mode === 'individual'" class="spacing-grid spacing-grid-2">
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

type Mode = 'none' | 'all' | 'xy' | 'individual';
type Side = 'top' | 'right' | 'bottom' | 'left';
type Properties = Record<Side, string>;

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
      type: Object as PropType<Properties>,
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

    top(): string {
      return this.readSide(this.properties.top);
    },

    right(): string {
      return this.readSide(this.properties.right);
    },

    bottom(): string {
      return this.readSide(this.properties.bottom);
    },

    left(): string {
      return this.readSide(this.properties.left);
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
    readSide(property: string): string {
      const activeRule = this.$store.getters.activeRule;
      let value = '';

      if (activeRule) {
        activeRule.clone().walkDecls(property, (decl: Declaration) => {
          value = decl.value;
        });
      }

      if (!value) {
        return '';
      }

      const [length, unit] = value.split(/(-?\d+)/).filter(Boolean);

      if (unit !== 'px') {
        return '';
      }

      return length;
    },

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

    apply(property: string, length: string): void {
      this.$store.dispatch('applyDeclaration', {
        property,
        value: length ? `${length}px` : '',
      });
    },

    setAll(length: string): void {
      this.apply(this.properties.top, length);
      this.apply(this.properties.right, length);
      this.apply(this.properties.bottom, length);
      this.apply(this.properties.left, length);
    },

    setVertical(length: string): void {
      this.apply(this.properties.top, length);
      this.apply(this.properties.bottom, length);
    },

    setHorizontal(length: string): void {
      this.apply(this.properties.left, length);
      this.apply(this.properties.right, length);
    },

    setSide(side: Side, length: string): void {
      this.apply(this.properties[side], length);
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
  display: grid;
  gap: 8px;
  padding-top: 2px;
}

.spacing-grid-1 {
  grid-template-columns: 1fr;
}

.spacing-grid-2 {
  grid-template-columns: 1fr 1fr;
}
</style>
