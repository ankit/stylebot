<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Dark Mode
    </css-property>

    <css-property-value>
      <b-button size="sm" @click="apply" variant="outline-secondary">
        Apply
      </b-button>
    </css-property-value>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

export default Vue.extend({
  name: 'DarkMode',

  components: {
    CssProperty,
    CssPropertyValue,
  },

  methods: {
    apply(): void {
      this.$store.dispatch('applyDarkMode');
    },
  },
});
</script>
