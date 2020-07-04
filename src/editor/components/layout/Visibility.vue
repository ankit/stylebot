<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Visibility
    </css-property>

    <css-property-value>
      <b-button
        size="sm"
        @click="toggle"
        :variant="isHidden ? 'secondary' : 'outline-secondary'"
      >
        Hide
      </b-button>
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

export default Vue.extend({
  name: 'Visibility',
  components: {
    CssProperty,
    CssPropertyValue,
  },

  computed: {
    isHidden(): boolean {
      const activeRule = this.$store.state.activeRule;
      let value = '';

      if (activeRule) {
        activeRule.clone().walkDecls('display', decl => {
          value = decl.value;
        });
      }

      return value === 'none';
    },
  },

  methods: {
    toggle(): void {
      let value = this.isHidden ? '' : 'none';

      this.$store.dispatch('applyDeclaration', {
        property: 'display',
        value,
      });
    },
  },
});
</script>
