<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      Align
    </css-property>

    <css-property-value>
      <b-button-group>
        <b-button title="Align left" variant="outline-secondary" size="sm">
          <b-icon icon="text-left" aria-hidden="true"></b-icon>
        </b-button>
        <b-button title="Align center" variant="outline-secondary" size="sm">
          <b-icon icon="text-center" aria-hidden="true"></b-icon>
        </b-button>
        <b-button title="Align right" variant="outline-secondary" size="sm">
          <b-icon icon="text-right" aria-hidden="true"></b-icon>
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
});
</script>
