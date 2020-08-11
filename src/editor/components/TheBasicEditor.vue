<template>
  <div>
    <b-row class="section" no-gutters>
      <b-col cols="12">
        <b-btn class="collapse-btn px-3 py-2" @click="text = !text">
          {{ t('text_properties') }}
        </b-btn>
      </b-col>

      <b-col cols="12" class="px-3">
        <b-collapse v-model="text">
          <the-text-properties class="pb-4" />
        </b-collapse>
      </b-col>
    </b-row>

    <b-row class="section" no-gutters>
      <b-col cols="12">
        <b-btn class="collapse-btn px-3 py-2" @click="colors = !colors">
          {{ t('color_properties') }}
        </b-btn>
      </b-col>

      <b-col cols="12" class="px-3">
        <b-collapse v-model="colors">
          <the-color-properties class="pb-4" />
        </b-collapse>
      </b-col>
    </b-row>

    <b-row class="section" no-gutters>
      <b-col cols="12">
        <b-btn class="collapse-btn px-3 py-2" @click="layout = !layout">
          {{ t('layout_properties') }}
        </b-btn>
      </b-col>

      <b-col cols="12" class="px-3">
        <b-collapse v-model="layout">
          <the-layout-properties class="pb-4" />
        </b-collapse>
      </b-col>
    </b-row>

    <b-row class="section" no-gutters>
      <b-col cols="12">
        <b-btn class="collapse-btn px-3 py-2" @click="border = !border">
          {{ t('border_properties') }}
        </b-btn>
      </b-col>

      <b-col cols="12" class="px-3">
        <b-collapse v-model="border">
          <the-border-properties class="pb-5" />
        </b-collapse>
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

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

  data(): {
    text: boolean;
    colors: boolean;
    layout: boolean;
    border: boolean;
  } {
    return {
      text: true,
      colors: true,
      layout: true,
      border: false,
    };
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
</style>
