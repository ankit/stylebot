<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Align
    </css-property>

    <css-property-value>
      <b-button-group>
        <b-button
          size="sm"
          :key="option.value"
          :title="option.title"
          v-for="option in options"
          @click="select(option.value)"
          :variant="value === option.value ? 'secondary' : 'outline-secondary'"
        >
          <b-icon :icon="option.icon" aria-hidden="true" />
        </b-button>
      </b-button-group>
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

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
      const activeRule = this.$store.state.activeRule;

      let value = '';
      if (activeRule) {
        activeRule.clone().walkDecls('text-align', decl => {
          value = decl.value;
        });
      }

      return value;
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
