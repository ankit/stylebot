<template>
  <b-input-group class="length-input-group">
    <b-form-input
      v-model="length"
      size="sm"
      :disabled="disabled"
      @focus="focus"
      @keydown="keydown"
    />

    <template v-if="sizes.length !== 0" #append>
      <dropdown-hack-to-support-shadow-dom>
        <b-dropdown size="sm" :disabled="disabled" variant="outline-secondary">
          <b-dropdown-item
            v-for="size in sizes"
            :key="size"
            @click="length = size"
          >
            {{ size }}
          </b-dropdown-item>
        </b-dropdown>
      </dropdown-hack-to-support-shadow-dom>
    </template>
  </b-input-group>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

import DropdownHackToSupportShadowDom from './DropdownHackToSupportShadowDom.vue';

export default Vue.extend({
  name: 'Length',

  components: {
    DropdownHackToSupportShadowDom,
  },

  props: {
    sizes: {
      type: Array,
      required: false,
      default: () => [],
    },

    property: {
      type: String,
      required: true,
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
          return '';
        }

        const [length, unit] = value.split(/(-?\d+)/).filter(Boolean);

        // todo: support other units.
        // currently, we render empty input and overwrite on edit
        if (unit !== 'px') {
          return '';
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

    disabled(): boolean {
      return !this.$store.state.activeSelector;
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

        if (!this.length) {
          this.length = '1';
        } else {
          this.length = `${parseInt(this.length, 10) + 1}`;
        }
      }

      // down arrow
      else if (event.keyCode === 40) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.length) {
          this.length = '-1';
        } else {
          this.length = `${parseInt(this.length, 10) - 1}`;
        }
      }
    },
  },
});
</script>

<style lang="scss">
.length-input-group {
  width: 65px !important;

  .dropdown-toggle {
    line-height: 21px !important;
  }
}
</style>
