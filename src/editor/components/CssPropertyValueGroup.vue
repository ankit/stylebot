<template>
  <b-col cols="7">
    <b-button-group>
      <b-button
        v-for="option in options"
        :key="option.value"
        size="sm"
        :disabled="disabled"
        :variant="value === option.value ? 'secondary' : 'outline-secondary'"
        @click="select(option.value)"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="option.content" />
      </b-button>
    </b-button-group>
  </b-col>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

export default Vue.extend({
  name: 'CssPropertyValueGroup',
  props: {
    property: {
      type: String,
      required: true,
    },

    options: {
      type: Array,
      required: true,
    },
  },

  computed: {
    value(): string {
      const activeRule = this.$store.getters.activeRule;

      let value = '';
      if (activeRule) {
        activeRule.clone().walkDecls(this.property, (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value;
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    select(value: string): void {
      if (value === this.value) {
        this.$store.dispatch('applyDeclaration', {
          property: this.property,
          value: '',
        });

        return;
      }

      this.$store.dispatch('applyDeclaration', {
        property: this.property,
        value,
      });
    },
  },
});
</script>
