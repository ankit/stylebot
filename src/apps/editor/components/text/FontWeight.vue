<template>
  <property-row property="font-weight" :label="t('font_weight')">
    <s-select
      menu-size="small"
      class="font-weight"
      :text="text"
      :muted="!value"
      :disabled="disabled"
      :menu-min-width="160"
      :menu-max-height="400"
      @close="onClose"
    >
      <template #default="{ close }">
        <s-menu-item
          :selected="!value"
          @mouseenter.native="previewWeight('')"
          @focus.native="previewWeight('')"
          @click="
            select('');
            close();
          "
        >
          {{ t('default') }}
        </s-menu-item>
        <s-menu-item
          v-for="option in options"
          :key="option.value"
          :selected="option.value === selectedValue"
          @mouseenter.native="previewWeight(option.value)"
          @focus.native="previewWeight(option.value)"
          @click="
            select(option.value);
            close();
          "
        >
          <span class="font-weight-option">
            <span class="font-weight-number">{{ option.value }}</span>
            {{ option.title }}
          </span>
        </s-menu-item>
      </template>
    </s-select>
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { SSelect, SMenuItem } from '@stylebot/components';
import { getDeclarationValue } from '@stylebot/css';
import type { Debounced } from '@stylebot/utils';
import { debounce } from '@stylebot/utils';

import PropertyRow from '../basic/PropertyRow.vue';
import { computedKeywordPlaceholder } from '../../utils/computed-placeholder';

const KEYWORDS: Record<string, string> = { normal: '400', bold: '700' };
const PREVIEW_DELAY = 100;

export default Vue.extend({
  name: 'FontWeight',

  components: {
    PropertyRow,
    SSelect,
    SMenuItem,
  },

  data(): {
    options: Array<{ title: string; value: string }>;
    previewWeight: Debounced<[string]>;
    applying: boolean;
  } {
    return {
      // Sweeping down the list settles on a row before the page changes.
      previewWeight: debounce(
        value =>
          this.$store.dispatch('previewDeclaration', {
            property: 'font-weight',
            value,
          }),
        PREVIEW_DELAY
      ),
      applying: false,
      options: [
        { title: this.t('thin'), value: '100' },
        { title: this.t('extra_light'), value: '200' },
        { title: this.t('light'), value: '300' },
        { title: this.t('regular'), value: '400' },
        { title: this.t('medium'), value: '500' },
        { title: this.t('semibold'), value: '600' },
        { title: this.t('bold'), value: '700' },
        { title: this.t('extra_bold'), value: '800' },
        { title: this.t('black'), value: '900' },
      ],
    };
  },

  computed: {
    value(): string {
      return getDeclarationValue(this.$store.getters.activeRule, 'font-weight');
    },

    selectedValue(): string {
      return KEYWORDS[this.value] ?? this.value;
    },

    // Unset, it shows the page's own weight, muted.
    text(): string {
      const value =
        this.selectedValue ||
        computedKeywordPlaceholder(
          this.$store.state.computedStyles,
          'font-weight'
        );
      const option = this.options.find(o => o.value === value);

      return option?.title ?? (this.value || this.t('default'));
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  beforeDestroy() {
    this.clearPreview();
  },

  methods: {
    clearPreview(): void {
      this.previewWeight.cancel();
      this.$store.dispatch('previewDeclaration', {
        property: 'font-weight',
        value: '',
      });
    },

    /**
     * Drops the preview only once the pick is on the page, so the old
     * weight doesn't flash back in between.
     */
    async select(value: string): Promise<void> {
      this.previewWeight.cancel();
      this.applying = true;
      await this.$store.dispatch('applyDeclaration', {
        property: 'font-weight',
        value,
      });
      this.applying = false;
      this.clearPreview();
    },

    onClose(): void {
      if (!this.applying) {
        this.clearPreview();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.font-weight ::v-deep .select-trigger {
  min-width: 0;
  width: 128px;
}

.font-weight-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.font-weight-number {
  flex: none;
  width: 3ch;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
