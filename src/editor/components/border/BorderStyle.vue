<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      {{ t('border_style') }}
    </css-property>

    <dropdown-hack-to-support-shadow-dom>
      <b-dropdown
        size="sm"
        :text="text"
        :disabled="disabled"
        class="border-style-dropdown"
        variant="outline-secondary"
      >
        <b-dropdown-item
          v-for="option in options"
          :key="option.title"
          @click="select(option.value)"
        >
          {{ option.title }}
        </b-dropdown-item>
      </b-dropdown>
    </dropdown-hack-to-support-shadow-dom>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { t } from '@stylebot/i18n';
import { Declaration } from 'postcss';

import CssProperty from '../CssProperty.vue';
import DropdownHackToSupportShadowDom from '../DropdownHackToSupportShadowDom.vue';

export default Vue.extend({
  name: 'BorderStyle',

  components: {
    CssProperty,
    DropdownHackToSupportShadowDom,
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
    text(): string {
      const activeRule = this.$store.getters.activeRule;

      let value = '';
      if (activeRule) {
        activeRule.clone().walkDecls('border-style', (decl: Declaration) => {
          value = decl.value;
        });
      }

      if (value) {
        const option = this.options.find(o => o.value === value);
        if (option) {
          return option.title;
        }
      }

      return t('default');
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

<style lang="scss">
.border-style-dropdown {
  .dropdown-toggle {
    border-top-left-radius: 3.2px !important;
    border-bottom-left-radius: 3.2px !important;
  }
}
</style>
