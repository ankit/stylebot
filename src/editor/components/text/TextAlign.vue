<template>
  <b-row align-content="center" no-gutters>
    <css-property>Align</css-property>

    <css-property-value>
      <b-button-group>
        <b-button
          v-for="option in options"
          :key="option.value"
          size="sm"
          :disabled="disabled"
          :title="option.title"
          :variant="value === option.value ? 'secondary' : 'outline-secondary'"
          @click="select(option.value)"
        >
          <b-icon :icon="option.icon" aria-hidden="true" />
        </b-button>
      </b-button-group>
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

export default Vue.extend({
  name: 'TextAlign',

  components: {
    CssProperty,
    CssPropertyValue,
  },

  data(): any {
    return {
      options: [
        { title: 'Align Left', value: 'left', icon: 'text-left' },
        { title: 'Align Center', value: 'center', icon: 'text-center' },
        { title: 'Align Right', value: 'right', icon: 'text-right' },
      ],
    };
  },

  computed: {
    value(): string {
      const activeRule = this.$store.getters.activeRule;

      let value = '';
      if (activeRule) {
        activeRule.clone().walkDecls('text-align', (decl: Declaration) => {
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
          property: 'text-align',
          value: '',
        });

        return;
      }

      this.$store.dispatch('applyDeclaration', {
        property: 'text-align',
        value,
      });
    },
  },
});
</script>
