<template>
  <property-row :label="t('font_style')">
    <s-select :text="text" :muted="!weight && !style" :disabled="disabled" :menu-min-width="150">
      <template #default="{ close }">
        <menu-item
          v-for="option in boldOptions"
          :key="option.title"
          :selected="isSelected(option)"
          @click="select(option); close();"
        >
          {{ option.title }}
        </menu-item>

        <hr class="menu-divider" />

        <menu-item
          v-for="option in italicOptions"
          :key="option.title"
          :selected="isSelected(option)"
          @click="select(option); close();"
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

type FontStyleOption = { title: string; weight: string; style: string };

export default Vue.extend({
  name: 'FontStyle',

  components: {
    SSelect,
    MenuItem,
    PropertyRow,
  },

  data(): {
    boldOptions: Array<FontStyleOption>;
    italicOptions: Array<FontStyleOption>;
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
    weight(): string {
      return this.declValue('font-weight');
    },

    style(): string {
      return this.declValue('font-style');
    },

    text(): string {
      if (this.weight) {
        if (this.style === 'italic') {
          const option = this.italicOptions.find(
            o => o.weight === this.weight && o.style === this.style
          );

          if (option) {
            return option.title;
          }
        } else {
          const option = this.boldOptions.find(o => o.weight === this.weight);

          if (option) {
            return option.title;
          }
        }
      } else if (this.style) {
        return t('italic');
      }

      return t('default');
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    declValue(property: string): string {
      const activeRule = this.$store.getters.activeRule;
      let value = '';

      if (activeRule) {
        activeRule.clone().walkDecls(property, (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value;
    },

    isSelected(option: FontStyleOption): boolean {
      return option.weight === this.weight && option.style === this.style;
    },

    select({ weight, style }: FontStyleOption): void {
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

<style lang="scss" scoped>
.menu-divider {
  margin: 4px 2px;
  border: none;
  border-top: 1px solid var(--border);
}
</style>
