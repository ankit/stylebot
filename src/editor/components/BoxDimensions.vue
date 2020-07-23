<template>
  <b-row no-gutters>
    <b-col class="box-dimension" cols="2">
      <b-form-input
        v-model="top"
        size="sm"
        placeholder="T"
        :disabled="disabled"
        class="box-dimension-input"
        @focus="focus"
        @keydown="keydown($event, 'top')"
      />
    </b-col>

    <b-col class="box-dimension" cols="2">
      <b-form-input
        v-model="right"
        size="sm"
        placeholder="R"
        :disabled="disabled"
        class="box-dimension-input"
        @focus="focus"
        @keydown="keydown($event, 'right')"
      />
    </b-col>

    <b-col class="box-dimension" cols="2">
      <b-form-input
        v-model="bottom"
        size="sm"
        placeholder="B"
        :disabled="disabled"
        class="box-dimension-input"
        @focus="focus"
        @keydown="keydown($event, 'bottom')"
      />
    </b-col>

    <b-col class="box-dimension" cols="2">
      <b-form-input
        v-model="left"
        size="sm"
        placeholder="L"
        :disabled="disabled"
        class="box-dimension-input"
        @focus="focus"
        @keydown="keydown($event, 'left')"
      />
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

export default Vue.extend({
  name: 'BoxDimensions',

  props: {
    property: {
      type: String,
      required: true,
    },
  },

  computed: {
    top: {
      get(): string {
        return this.get('top');
      },

      set(top: string): void {
        this.put('top', top);
      },
    },

    right: {
      get(): string {
        return this.get('right');
      },

      set(right: string): void {
        this.put('right', right);
      },
    },

    bottom: {
      get(): string {
        return this.get('bottom');
      },

      set(bottom: string): void {
        this.put('bottom', bottom);
      },
    },

    left: {
      get(): string {
        return this.get('left');
      },

      set(left: string): void {
        return this.put('left', left);
      },
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    get(type: 'top' | 'right' | 'bottom' | 'left'): string {
      const activeRule = this.$store.getters.activeRule;
      let value = '';

      if (activeRule) {
        // todo: support declarations of the form: margin: [all]px, margin: [x]px [y]px
        activeRule
          .clone()
          .walkDecls(`${this.property}-${type}`, (decl: Declaration) => {
            value = decl.value;
          });
      }

      const [length, unit] = value.split(/(-?\d+)/).filter(Boolean);

      // todo: support other units.
      // currently, we render empty input and overwrite on edit
      if (unit !== 'px') {
        return '';
      }

      return length;
    },

    put(type: 'top' | 'right' | 'bottom' | 'left', length: string): void {
      let value = '';

      if (length) {
        value = `${length}px`;
      }

      this.$store.dispatch('applyDeclaration', {
        property: `${this.property}-${type}`,
        value,
      });
    },

    focus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },

    keydown(
      event: KeyboardEvent,
      direction: 'top' | 'right' | 'bottom' | 'left'
    ): void {
      // up arrow
      if (event.keyCode === 38) {
        event.preventDefault();
        event.stopPropagation();

        if (!this[direction]) {
          this[direction] = '1';
        } else {
          this[direction] = `${parseInt(this[direction], 10) + 1}`;
        }
      }

      // down arrow
      else if (event.keyCode === 40) {
        event.preventDefault();
        event.stopPropagation();

        if (!this[direction]) {
          this[direction] = '-1';
        } else {
          this[direction] = `${parseInt(this[direction], 10) - 1}`;
        }
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.box-dimension {
  min-width: 45px;
  margin-right: 3px;
}
</style>
