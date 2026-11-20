<template>
  <div class="basic-editor">
    <the-basic-editor-actions />

    <property-card
      :label="t('text_properties')"
      :collapsed="!open.text"
      :count="textCount"
      @toggle="toggle('text')"
    >
      <the-text-properties />
    </property-card>

    <property-card
      :label="t('colors')"
      :collapsed="!open.colors"
      :count="colorCount"
      @toggle="toggle('colors')"
    >
      <the-color-properties />
    </property-card>

    <property-card
      :label="t('layout')"
      :collapsed="!open.layout"
      :count="layoutCount"
      @toggle="toggle('layout')"
    >
      <the-layout-properties />
    </property-card>

    <property-card
      :label="t('effects_properties')"
      :collapsed="!open.effects"
      :count="effectsCount"
      @toggle="toggle('effects')"
    >
      <the-effects-properties />
    </property-card>

    <property-card
      :label="t('more_properties')"
      :collapsed="!open.more"
      :count="moreCount"
      @toggle="toggle('more')"
    >
      <the-more-properties />
    </property-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { Declaration, Rule } from 'postcss';
import type {
  StylebotBasicModeSection,
  StylebotCollapsedSections,
} from '@stylebot/types';
import { getPageBridge } from '@stylebot/page-bridge';

import PropertyCard from './basic/PropertyCard.vue';
import TheBasicEditorActions from './basic/TheBasicEditorActions.vue';
import TheTextProperties from './TheTextProperties.vue';
import TheColorProperties from './TheColorProperties.vue';
import TheLayoutProperties from './TheLayoutProperties.vue';
import TheEffectsProperties from './TheEffectsProperties.vue';
import TheMoreProperties from './TheMoreProperties.vue';

import {
  TEXT_PROPERTIES,
  COLOR_PROPERTIES,
  LAYOUT_PROPERTIES,
  EFFECTS_PROPERTIES,
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
    TheEffectsProperties,
    TheMoreProperties,
  },

  data(): {
    unsubscribeComputedStyles: (() => void) | null;
  } {
    return {
      unsubscribeComputedStyles: null,
    };
  },

  computed: {
    // Only collapsed sections are saved, so any other section is open.
    open(): Record<StylebotBasicModeSection, boolean> {
      const collapsed: StylebotCollapsedSections =
        this.$store.state.options.basicModeCollapsedSections;

      return {
        text: !collapsed.text,
        colors: !collapsed.colors,
        layout: !collapsed.layout,
        effects: !collapsed.effects,
        more: !collapsed.more,
      };
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

    effectsCount(): number {
      return this.countDeclarations(prop => EFFECTS_PROPERTIES.includes(prop));
    },

    moreCount(): number {
      return this.countDeclarations(prop => !KNOWN_PROPERTIES.includes(prop));
    },

    // Anything that can change what the page computes for the selector.
    computedStylesInputs(): Array<unknown> {
      const { css, enabled, forceImportant, pageConnected } = this.$store.state;
      const { inspectedSelector } = this.$store.getters;
      return [inspectedSelector, css, enabled, forceImportant, pageConnected];
    },
  },

  watch: {
    computedStylesInputs: {
      immediate: true,
      handler(): void {
        this.$store.dispatch('refreshComputedStyles');
        this.$store.dispatch('refreshAppliedDeclarations');
        this.$store.dispatch('refreshPageDeclarations');
      },
    },
  },

  // A pick reads the element while it's still hovered.
  created() {
    this.unsubscribeComputedStyles = getPageBridge().on(
      'computedStylesChanged',
      () => this.$store.dispatch('refreshComputedStyles')
    );
  },

  beforeDestroy() {
    this.unsubscribeComputedStyles?.();
  },

  methods: {
    countDeclarations(matches: (property: string) => boolean): number {
      const rule = this.activeRule;
      if (!rule) {
        return 0;
      }

      let count = 0;
      rule.walkDecls((decl: Declaration) => {
        if (matches(decl.prop)) {
          count++;
        }
      });

      return count;
    },

    toggle(name: StylebotBasicModeSection): void {
      this.$store.dispatch('setBasicModeCollapsedSections', {
        ...this.$store.state.options.basicModeCollapsedSections,
        [name]: this.open[name],
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
  flex: 1 0 auto;
  gap: 8px;
  padding: 12px var(--panel-gutter);
  background: var(--tab-surface);
}
</style>
