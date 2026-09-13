<template>
  <property-row :label="t('border')">
    <div class="border-control">
      <s-select class="border-style" :text="text" :muted="!styleValue" :disabled="disabled" :menu-min-width="160">
        <template #default="{ close }">
          <menu-item
            v-for="option in options"
            :key="option.value"
            :selected="option.value === styleValue"
            @click="selectStyle(option.value); close();"
          >
            <span class="border-style-option">
              <span class="border-style-preview" :style="{ borderBottomStyle: option.value }" />
              {{ option.title }}
            </span>
          </menu-item>
        </template>
      </s-select>

      <length class="border-width" property="border-width" :fallback="shorthandValue" />
      <color-picker class="border-color" property="border-color" :fallback="shorthandValue" />
    </div>
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { t } from '@stylebot/i18n';
import { Declaration } from 'postcss';
import { SSelect, MenuItem } from '@stylebot/components';

import PropertyRow from '../basic/PropertyRow.vue';
import Length from '../Length.vue';
import ColorPicker from '../color/ColorPicker.vue';
import { extractBorderStyle } from '../../utils/css-value';

export default Vue.extend({
  name: 'BorderControl',

  components: {
    PropertyRow,
    SSelect,
    MenuItem,
    Length,
    ColorPicker,
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
    // Raw value of the border shorthand (e.g. '1px solid #44475a'), used
    // to fall back to when the specific longhand isn't declared.
    shorthandValue(): string {
      const activeRule = this.$store.getters.activeRule;

      let value = '';
      if (activeRule) {
        activeRule.clone().walkDecls('border', (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value;
    },

    styleValue(): string {
      const activeRule = this.$store.getters.activeRule;

      let value = '';
      if (activeRule) {
        activeRule.clone().walkDecls('border-style', (decl: Declaration) => {
          value = decl.value;
        });
      }

      if (!value && this.shorthandValue) {
        value = extractBorderStyle(this.shorthandValue);
      }

      return value;
    },

    text(): string {
      const option = this.options.find(o => o.value === this.styleValue);
      return option ? option.title : t('default');
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    selectStyle(value: string): void {
      this.$store.dispatch('applyDeclaration', {
        property: 'border-style',
        value,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.border-control {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.border-style ::v-deep .select-trigger {
  min-width: 0;
  width: 96px;
}

.border-control .border-width {
  min-width: 0;
  width: 60px;
}

.border-color ::v-deep .color-field {
  width: 27px;
  height: 27px;
}

.border-style-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.border-style-preview {
  flex: none;
  width: 36px;
  height: 0;
  border-bottom: 3px solid var(--muted-foreground);
}

.border-color ::v-deep .color-hex {
  display: none;
}
</style>
