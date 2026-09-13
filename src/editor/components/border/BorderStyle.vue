<template>
  <property-row :label="t('border_style')">
    <s-select :text="text" :muted="!value" :disabled="disabled" :menu-min-width="140">
      <template #default="{ close }">
        <menu-item
          v-for="option in options"
          :key="option.value"
          :selected="option.value === value"
          @click="select(option.value); close();"
        >
          {{ option.title }}
        </menu-item>
      </template>
    </s-select>
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { t } from '@stylebot/i18n';
import { Declaration } from 'postcss';
import { SSelect, MenuItem } from '@stylebot/components';

import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'BorderStyle',

  components: {
    PropertyRow,
    SSelect,
    MenuItem,
  },

  data(): {
    options: Array<{
      title: string;
      value: string;
    }>;
  } {
    return {
      options: [
        { title: t('border_none'), value: 'none' },
        { title: t('border_solid'), value: 'solid' },
        { title: t('border_dotted'), value: 'dotted' },
        { title: t('border_dashed'), value: 'dashed' },
        { title: t('border_double'), value: 'double' },
        { title: t('border_groove'), value: 'groove' },
        { title: t('border_ridge'), value: 'ridge' },
        { title: t('border_inset'), value: 'inset' },
        { title: t('border_outset'), value: 'outset' },
      ],
    };
  },

  computed: {
    value(): string {
      const activeRule = this.$store.getters.activeRule;

      let value = '';
      if (activeRule) {
        activeRule.clone().walkDecls('border-style', (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value;
    },

    text(): string {
      const option = this.options.find(o => o.value === this.value);
      return option ? option.title : t('default');
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    select(value: string): void {
      this.$store.dispatch('applyDeclaration', {
        property: 'border-style',
        value,
      });
    },
  },
});
</script>
