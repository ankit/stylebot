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
      :label="t('background')"
      :collapsed="!open.colors"
      :count="colorCount"
      @toggle="toggle('colors')"
    >
      <the-color-properties />
    </property-card>

    <property-card
      :label="t('box')"
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
import type { StylebotBasicModeSections } from '@stylebot/types';

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

  data(): { open: StylebotBasicModeSections } {
    return {
      open: {
        text: false,
        colors: false,
        layout: false,
        effects: false,
        more: false,
      },
    };
  },

  computed: {
    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    userOpened(): StylebotBasicModeSections {
      return this.$store.state.options.basicModeOpenedSections;
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
      const { activeSelector, css, enabled, forceImportant, pageConnected } =
        this.$store.state;
      return [activeSelector, css, enabled, forceImportant, pageConnected];
    },
  },

  watch: {
    // Reflect what's actually styled on the newly picked element: open the
    // panels with matching declarations (Text alone when nothing is styled
    // yet), plus whichever panels the user opened by hand.
    activeSelector: {
      immediate: true,
      handler(): void {
        this.autoExpandSections();
      },
    },

    computedStylesInputs: {
      immediate: true,
      handler(): void {
        this.$store.dispatch('refreshComputedStyles');
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
      const effects = this.effectsCount > 0;
      const more = this.moreCount > 0;
      const styled = text || colors || layout || effects || more;

      this.open = {
        text: (styled ? text : true) || this.userOpened.text,
        colors: colors || this.userOpened.colors,
        layout: layout || this.userOpened.layout,
        effects: effects || this.userOpened.effects,
        more: more || this.userOpened.more,
      };
    },

    toggle(name: keyof StylebotBasicModeSections): void {
      const next = !this.open[name];
      this.open = { ...this.open, [name]: next };
      this.$store.dispatch('setBasicModeOpenedSections', {
        ...this.userOpened,
        [name]: next,
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
  background: var(--tab-surface);
}
</style>
