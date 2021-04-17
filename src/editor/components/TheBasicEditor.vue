<template>
  <div class="stylebot-basic-editor">
    <b-row class="section" no-gutters>
      <b-col cols="12">
        <b-btn class="collapse-btn px-3 py-2" @click="text = !text">
          {{ t('text_properties') }}
        </b-btn>
      </b-col>

      <b-collapse v-model="text" class="collapse-content">
        <b-col cols="12" class="px-3 py-2">
          <the-text-properties class="pb-4 pt-2" />
        </b-col>
      </b-collapse>
    </b-row>

    <b-row class="section" no-gutters>
      <b-col cols="12">
        <b-btn class="collapse-btn px-3 py-2" @click="colors = !colors">
          {{ t('color_properties') }}
        </b-btn>
      </b-col>

      <b-collapse v-model="colors" class="collapse-content">
        <b-col cols="12" class="px-3 py-2">
          <the-color-properties class="pb-4 pt-2" />
        </b-col>
      </b-collapse>
    </b-row>

    <b-row class="section" no-gutters>
      <b-col cols="12">
        <b-btn class="collapse-btn px-3 py-2" @click="layout = !layout">
          {{ t('layout_properties') }}
        </b-btn>
      </b-col>

      <b-collapse v-model="layout" class="collapse-content">
        <b-col cols="12" class="px-3 py-2">
          <the-layout-properties class="pb-4 pt-2" />
        </b-col>
      </b-collapse>
    </b-row>

    <b-row class="section" no-gutters>
      <b-col cols="12">
        <b-btn class="collapse-btn px-3 py-2" @click="border = !border">
          {{ t('border_properties') }}
        </b-btn>
      </b-col>

      <b-collapse v-model="border" class="collapse-content">
        <b-col cols="12" class="px-3 py-2">
          <the-border-properties class="pb-5 pt-2" />
        </b-col>
      </b-collapse>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { StylebotBasicModeSections } from '@stylebot/types';

import TheTextProperties from './TheTextProperties.vue';
import TheColorProperties from './TheColorProperties.vue';
import TheLayoutProperties from './TheLayoutProperties.vue';
import TheBorderProperties from './TheBorderProperties.vue';

export default Vue.extend({
  name: 'TheBasicEditor',

  components: {
    TheTextProperties,
    TheColorProperties,
    TheLayoutProperties,
    TheBorderProperties,
  },

  computed: {
    text: {
      get(): boolean {
        return this.$store.state.options.basicModeSections.text;
      },
      set(value: boolean) {
        this.set('text', value);
      },
    },
    colors: {
      get(): boolean {
        return this.$store.state.options.basicModeSections.colors;
      },
      set(value: boolean) {
        this.set('colors', value);
      },
    },
    layout: {
      get(): boolean {
        return this.$store.state.options.basicModeSections.layout;
      },
      set(value: boolean) {
        this.set('layout', value);
      },
    },
    border: {
      get(): boolean {
        return this.$store.state.options.basicModeSections.border;
      },
      set(value: boolean) {
        this.set('border', value);
      },
    },
  },

  methods: {
    set(name: keyof StylebotBasicModeSections, value: boolean) {
      const sections = this.$store.state.options.basicModeSections;

      this.$store.dispatch('setBasicModeSections', {
        ...sections,
        [name]: value,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.section {
  border-top: 1px solid #ddd;

  &:first-of-type {
    border: none;
    margin-top: 0;
  }
}

.collapse-btn {
  background: none !important;
  border-radius: 0 !important;
  border: none !important;
  color: #333 !important;
  padding: 0 !important;
  width: 100% !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  text-align: left !important;

  &:focus {
    border: none !important;
    box-shadow: none !important;
  }
}

.collapse-content {
  width: 100%;
}
</style>
