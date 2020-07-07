<template>
  <b-row no-gutters>
    <b-col class="box-dimension" cols="2">
      <b-form-input size="sm" v-model="top" placeholder="T" />
    </b-col>

    <b-col class="box-dimension" cols="2">
      <b-form-input size="sm" v-model="right" placeholder="R" />
    </b-col>

    <b-col class="box-dimension" cols="2">
      <b-form-input size="sm" v-model="bottom" placeholder="B" />
    </b-col>

    <b-col class="box-dimension" cols="2">
      <b-form-input size="sm" v-model="left" placeholder="L" />
    </b-col>

    <b-col cols="1" class="text-muted box-dimension-unit">px</b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

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
  },

  methods: {
    get(type: 'top' | 'right' | 'bottom' | 'left'): string {
      const activeRule = this.$store.state.activeRule;
      let value = '';

      if (activeRule) {
        // todo: support declarations of the form: margin: [all]px, margin: [x]px [y]px
        activeRule.clone().walkDecls(`${this.property}-${type}`, decl => {
          value = decl.value;
        });
      }

      const [length, unit] = value.split(/(\d+)/).filter(Boolean);

      // todo: support other units.
      // currently, we render empty input and overwrite on edit
      if (unit !== 'px') {
        return '';
      }

      return length;
    },

    put(type: 'top' | 'right' | 'bottom' | 'left', length: string): void {
      console.log('put', type, length);
      let value = '';

      if (length) {
        value = `${length}px`;
      }

      this.$store.dispatch('applyDeclaration', {
        property: `${this.property}-${type}`,
        value,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.box-dimension {
  min-width: 40px;
  margin-right: 3px;
}

.box-dimension-unit {
  font-size: 13px;
  line-height: 26px;
}
</style>
