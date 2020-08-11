<template>
  <b-row align-content="center" no-gutters>
    <css-property>
      {{ t('font_style') }}
    </css-property>

    <dropdown-hack-to-support-shadow-dom>
      <b-dropdown
        size="sm"
        :text="text"
        :disabled="disabled"
        class="font-style-dropdown"
        variant="outline-secondary"
      >
        <b-dropdown-item
          v-for="option in boldOptions"
          :key="option.title"
          @click="select(option)"
        >
          {{ option.title }}
        </b-dropdown-item>

        <b-dropdown-divider></b-dropdown-divider>

        <b-dropdown-item
          v-for="option in italicOptions"
          :key="option.title"
          @click="select(option)"
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
  name: 'FontStyle',

  components: {
    CssProperty,
    DropdownHackToSupportShadowDom,
  },

  data(): {
    boldOptions: Array<{
      title: string;
      weight: string;
      style: string;
    }>;

    italicOptions: Array<{
      title: string;
      weight: string;
      style: string;
    }>;
  } {
    return {
      boldOptions: [
        { title: t('thin'), weight: '100', style: 'normal' },
        { title: t('light'), weight: '300', style: 'normal' },
        { title: t('regular'), weight: '400', style: 'normal' },
        { title: t('medium'), weight: '500', style: 'normal' },
        { title: t('bold'), weight: '700', style: 'normal' },
        { title: t('black'), weight: '900', style: 'normal' },
      ],

      italicOptions: [
        { title: t('thin_italic'), weight: '100', style: 'italic' },
        { title: t('light_italic'), weight: '300', style: 'italic' },
        { title: t('italic'), weight: '400', style: 'italic' },
        { title: t('medium_italic'), weight: '500', style: 'italic' },
        { title: t('bold_italic'), weight: '700', style: 'italic' },
        { title: t('black_italic'), weight: '900', style: 'italic' },
      ],
    };
  },

  computed: {
    text(): string {
      const activeRule = this.$store.getters.activeRule;

      let weight = '';
      let style = '';

      if (activeRule) {
        activeRule.clone().walkDecls('font-weight', (decl: Declaration) => {
          weight = decl.value;
        });

        activeRule.clone().walkDecls('font-style', (decl: Declaration) => {
          style = decl.value;
        });
      }

      if (weight) {
        if (style === 'italic') {
          const option = this.italicOptions.find(
            o => o.weight === weight && o.style === style
          );

          if (option) {
            return option.title;
          }
        } else {
          const option = this.boldOptions.find(o => o.weight === weight);

          if (option) {
            return option.title;
          }
        }
      } else if (style) {
        return 'Italic';
      }

      return 'Default';
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    select({ weight, style }: { weight: string; style: string }): void {
      this.$store.dispatch('applyDeclaration', {
        property: 'font-weight',
        value: weight,
      });

      this.$store.dispatch('applyDeclaration', {
        property: 'font-style',
        value: style,
      });
    },
  },
});
</script>

<style lang="scss">
.font-style-dropdown {
  .dropdown-toggle {
    border-top-left-radius: 3.2px !important;
    border-bottom-left-radius: 3.2px !important;
  }
}
</style>
