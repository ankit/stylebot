<template>
  <property-row :label="t('font_family')">
    <s-select
      full-width
      :menu-min-width="184"
      :text="text"
      :muted="!value"
      :disabled="disabled"
    >
      <template #default="{ close }">
        <menu-item dense :selected="!value" @click="select(''); close();">
          {{ t('default') }}
        </menu-item>

        <menu-item
          v-for="font in fonts"
          :key="font"
          dense
          :selected="value === font"
          @click="select(font); close();"
        >
          <span :style="{ fontFamily: font }">{{ font }}</span>
        </menu-item>

        <menu-item dense class="edit-fonts" @click="editFonts(); close();">
          {{ t('fonts_edit_list') }}
        </menu-item>
      </template>
    </s-select>
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

import { StylebotFonts } from '@stylebot/types';
import { SSelect, MenuItem } from '@stylebot/components';

import PropertyRow from '../basic/PropertyRow.vue';
import { openOptionsPage } from '../../utils/chrome';

export default Vue.extend({
  name: 'FontFamily',

  components: {
    SSelect,
    MenuItem,
    PropertyRow,
  },

  computed: {
    value(): string {
      const activeRule = this.$store.getters.activeRule;
      let value = '';

      if (activeRule) {
        activeRule.clone().walkDecls('font-family', (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value;
    },

    text(): string {
      return this.value || this.t('default');
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },

    fonts(): StylebotFonts {
      return this.$store.state.options.fonts;
    },
  },

  methods: {
    select(value: string): void {
      this.$store.dispatch('applyFontFamily', value);
    },

    editFonts(): void {
      openOptionsPage();
    },
  },
});
</script>

<style lang="scss" scoped>
.edit-fonts {
  color: var(--primary);
}
</style>
