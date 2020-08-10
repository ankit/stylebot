<template>
  <b-form-input
    v-model="length"
    size="sm"
    :disabled="disabled"
    class="box-model-length"
    @focus="focus"
    @keydown="keydown"
    @input="$emit('input')"
  />
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

export default Vue.extend({
  name: 'BoxModelLength',

  props: {
    property: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
    },
  },

  computed: {
    length: {
      get(): string {
        const activeRule = this.$store.getters.activeRule;
        let value = '';

        if (activeRule) {
          activeRule.clone().walkDecls(this.property, (decl: Declaration) => {
            value = decl.value;
          });
        }

        if (!value) {
          return '-';
        }

        const [length, unit] = value.split(/(-?\d+)/).filter(Boolean);

        // todo: support other units.
        // currently, we render empty input and overwrite on edit
        if (unit !== 'px') {
          return '-';
        }

        return length;
      },

      set(length: string): void {
        const value = length ? `${length}px` : '';

        this.$store.dispatch('applyDeclaration', {
          property: this.property,
          value,
        });
      },
    },
  },

  methods: {
    focus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },

    keydown(event: KeyboardEvent): void {
      // up arrow
      if (event.keyCode === 38) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.length || this.length === '-') {
          this.length = '1';
        } else {
          this.length = `${parseInt(this.length, 10) + 1}`;
        }

        this.$emit('input');
      }

      // down arrow
      else if (event.keyCode === 40) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.length || this.length === '-') {
          this.length = '-1';
        } else {
          this.length = `${parseInt(this.length, 10) - 1}`;
        }

        this.$emit('input');
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.box-model-length {
  width: 30px !important;
  height: 18px !important;
  font-size: 12px !important;
  border: none !important;
  border-radius: 0 !important;
  text-align: center !important;
  color: #333 !important;
  background: transparent !important;

  &:hover:not(:disabled) {
    background: rgb(255 255 255 / 90%) !important;
  }

  &:focus {
    border: 1px solid #555;
    box-shadow: none !important;
    background: rgb(255 255 255 / 90%) !important;
  }
}
</style>
