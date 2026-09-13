<template>
  <div class="basic-editor">
    <the-basic-editor-actions />

    <property-card
      :label="t('text_properties')"
      :collapsed="!sections.text"
      @toggle="toggle('text')"
    >
      <the-text-properties />
    </property-card>

    <property-card
      :label="t('color_properties')"
      :collapsed="!sections.colors"
      @toggle="toggle('colors')"
    >
      <the-color-properties />
    </property-card>

    <property-card
      :label="t('layout_properties')"
      :collapsed="!sections.layout"
      @toggle="toggle('layout')"
    >
      <the-layout-properties />
    </property-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { StylebotBasicModeSections } from '@stylebot/types';

import PropertyCard from './basic/PropertyCard.vue';
import TheBasicEditorActions from './basic/TheBasicEditorActions.vue';
import TheTextProperties from './TheTextProperties.vue';
import TheColorProperties from './TheColorProperties.vue';
import TheLayoutProperties from './TheLayoutProperties.vue';

export default Vue.extend({
  name: 'TheBasicEditor',

  components: {
    PropertyCard,
    TheBasicEditorActions,
    TheTextProperties,
    TheColorProperties,
    TheLayoutProperties,
  },

  computed: {
    sections(): StylebotBasicModeSections {
      return this.$store.state.options.basicModeSections;
    },
  },

  methods: {
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
