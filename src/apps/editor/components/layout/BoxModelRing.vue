<template>
  <div class="box-ring" :class="[`box-ring-${kind}`, { disabled }]">
    <span class="box-ring-label">{{ label }}</span>

    <s-number-field
      v-for="side in sides"
      :key="side"
      class="box-ring-field"
      :class="`box-ring-${side}`"
      :aria-label="`${label} ${t(side)}`"
      :value="values[side]"
      :placeholder="placeholders[side]"
      :disabled="disabled"
      @input="setSide(side, $event)"
    />

    <div class="box-ring-inner">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { Declaration } from 'postcss';
import { SNumberField } from '@stylebot/components';

import { computedSides } from '../../utils/computed-placeholder';
import type { Side, Sides } from '../../utils/spacing';
import {
  parseLength,
  expandShorthand,
  resolveSpacingDeclarations,
} from '../../utils/spacing';

const SIDES: Array<Side> = ['top', 'left', 'right', 'bottom'];

export default Vue.extend({
  name: 'BoxModelRing',

  components: {
    SNumberField,
  },

  props: {
    kind: {
      type: String as PropType<'margin' | 'padding'>,
      required: true,
    },

    label: {
      type: String,
      required: true,
    },
  },

  computed: {
    sides(): Array<Side> {
      return SIDES;
    },

    properties(): Sides {
      return {
        top: `${this.kind}-top`,
        right: `${this.kind}-right`,
        bottom: `${this.kind}-bottom`,
        left: `${this.kind}-left`,
      };
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },

    values(): Sides {
      const sides: Sides = { top: '', right: '', bottom: '', left: '' };
      const activeRule = this.$store.getters.activeRule;

      if (!activeRule) {
        return sides;
      }

      activeRule.walkDecls((decl: Declaration) => {
        if (decl.prop === this.kind) {
          const expanded = expandShorthand(decl.value);

          if (expanded) {
            Object.assign(sides, expanded);
          }
        } else {
          SIDES.forEach(side => {
            if (decl.prop === this.properties[side]) {
              sides[side] = decl.value;
            }
          });
        }
      });

      return {
        top: parseLength(sides.top),
        right: parseLength(sides.right),
        bottom: parseLength(sides.bottom),
        left: parseLength(sides.left),
      };
    },

    placeholders(): Sides {
      return computedSides(this.$store.state.computedStyles, this.properties);
    },
  },

  methods: {
    setSide(side: Side, length: string): void {
      const sides = { ...this.values, [side]: length };

      resolveSpacingDeclarations(sides, this.properties, this.kind).forEach(
        ({ property, value }) => {
          this.$store.dispatch('applyDeclaration', { property, value });
        }
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.box-ring {
  position: relative;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 38px;
  grid-template-areas:
    '. top .'
    'left inner right'
    '. bottom .';
  align-items: center;
  justify-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;

  &.disabled {
    opacity: 0.6;
  }
}

.box-ring-margin {
  border: 1px dashed var(--box-margin-edge);
  background: var(--box-margin);
}

.box-ring-padding {
  column-gap: 6px;
  border: 1px solid var(--box-padding-edge);
  background: var(--box-padding);
}

.box-ring-margin > .box-ring-label {
  color: var(--box-margin-label);
}

.box-ring-padding > .box-ring-label {
  color: var(--box-padding-label);
}

.box-ring-label {
  position: absolute;
  top: 4px;
  left: 7px;
  font-size: 12px;
  pointer-events: none;
}

.box-ring-top {
  grid-area: top;
}

.box-ring-left {
  grid-area: left;
}

.box-ring-right {
  grid-area: right;
}

.box-ring-bottom {
  grid-area: bottom;
}

.box-ring-inner {
  grid-area: inner;
  align-self: stretch;
  justify-self: stretch;
  display: flex;
}

.box-ring-field.number-field {
  width: 36px;
  height: 22px;
  background: var(--card-surface);

  &:has(.number-input:placeholder-shown):not(:hover):not(:focus-within) {
    border-color: transparent;
  }

  &:has(.number-input:placeholder-shown):hover:not(:focus-within) {
    border-color: var(--field-border-hover);
  }

  ::v-deep .number-input::placeholder {
    color: var(--box-value);
  }

  ::v-deep .number-input {
    padding: 0 4px;
    text-align: center;
  }
}
</style>
