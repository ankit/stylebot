<template>
  <div class="basic-editor">
    <the-basic-editor-actions />

    <property-card
      :label="t('text_properties')"
      :collapsed="!sections.text"
      :count="textCount"
      @toggle="toggle('text')"
    >
      <the-text-properties />
    </property-card>

    <property-card
      :label="t('color_properties')"
      :collapsed="!sections.colors"
      :count="colorCount"
      @toggle="toggle('colors')"
    >
      <the-color-properties />
    </property-card>

    <property-card
      :label="t('layout_properties')"
      :collapsed="!sections.layout"
      :count="layoutCount"
      @toggle="toggle('layout')"
    >
      <the-layout-properties />
    </property-card>

    <property-card
      :label="t('more_properties')"
      :collapsed="!sections.more"
      :count="moreCount"
      @toggle="toggle('more')"
    >
      <the-more-properties />
    </property-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration, Rule } from 'postcss';
import { StylebotBasicModeSections } from '@stylebot/types';

import PropertyCard from './basic/PropertyCard.vue';
import TheBasicEditorActions from './basic/TheBasicEditorActions.vue';
import TheTextProperties from './TheTextProperties.vue';
import TheColorProperties from './TheColorProperties.vue';
import TheLayoutProperties from './TheLayoutProperties.vue';
import TheMoreProperties from './TheMoreProperties.vue';

import {
  TEXT_PROPERTIES,
  COLOR_PROPERTIES,
  LAYOUT_PROPERTIES,
  KNOWN_PROPERTIES,
} from '../utils/basic-properties';

export default Vue.extend({
  name: 'TheBasicEditor',

  components: {
    PropertyCard,
    TheBasicEditorActions,
    TheTextProperties,
    TheColorProperties,
    TheLayoutProperties,
    TheMoreProperties,
  },

  computed: {
    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    sections(): StylebotBasicModeSections {
      return this.$store.state.options.basicModeSections;
    },

    activeRule(): Rule | null {
      return this.$store.getters.activeRule;
    },

    textCount(): number {
      return this.countDeclarations(prop => TEXT_PROPERTIES.includes(prop));
    },

    colorCount(): number {
      return this.countDeclarations(prop => COLOR_PROPERTIES.includes(prop));
    },

    layoutCount(): number {
      return this.countDeclarations(prop => LAYOUT_PROPERTIES.includes(prop));
    },

    moreCount(): number {
      return this.countDeclarations(prop => !KNOWN_PROPERTIES.includes(prop));
    },
  },

  watch: {
    // Reflect what's actually styled on the newly picked element: open only
    // the panels with matching declarations, and fall back to Text alone
    // when nothing on the element is styled yet.
    activeSelector: {
      immediate: true,
      handler(): void {
        this.autoExpandSections();
      },
    },
  },

  methods: {
    countDeclarations(matches: (property: string) => boolean): number {
      const rule = this.activeRule;
      if (!rule) {
        return 0;
      }

      let count = 0;
      rule.clone().walkDecls((decl: Declaration) => {
        if (matches(decl.prop)) {
          count++;
        }
      });

      return count;
    },

    autoExpandSections(): void {
      const text = this.textCount > 0;
      const colors = this.colorCount > 0;
      const layout = this.layoutCount > 0;
      const more = this.moreCount > 0;

      this.$store.dispatch(
        'setBasicModeSections',
        text || colors || layout || more
          ? { ...this.sections, text, colors, layout, more }
          : { ...this.sections, text: true, colors: false, layout: false, more: false }
      );
    },

    toggle(name: keyof StylebotBasicModeSections): void {
      this.$store.dispatch('setBasicModeSections', {
        ...this.sections,
        [name]: !this.sections[name],
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.basic-editor {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  gap: 10px;
  padding: 12px;
  background: var(--accent);
}
</style>
