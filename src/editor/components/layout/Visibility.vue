<template>
  <property-row :label="t('visibility')">
    <toggle-switch class="visibility-toggle" :value="!isHidden" :disabled="disabled" @change="toggle" />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';
import { ToggleSwitch } from '@stylebot/components';

import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'Visibility',

  components: {
    PropertyRow,
    ToggleSwitch,
  },

  computed: {
    isHidden(): boolean {
      const activeRule = this.$store.getters.activeRule;
      let value = '';

      if (activeRule) {
        activeRule.clone().walkDecls('display', (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value === 'none';
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    toggle(visible: boolean): void {
      this.$store.dispatch('applyDeclaration', {
        property: 'display',
        value: visible ? '' : 'none',
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.visibility-toggle {
  width: auto;
}

.visibility-toggle ::v-deep .label {
  display: none;
}
</style>
