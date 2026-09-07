<template>
  <div class="the-readability">
    <b-form-checkbox
      v-model="value"
      switch
      class="enable-readability"
      :disabled="!pageReaderable"
    >
      {{ t('enable_readability') }}
    </b-form-checkbox>

    <p class="lead pt-2">
      {{ t('readability_description') }}
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { isReaderable } from '@stylebot/readability';

export default Vue.extend({
  name: 'TheReadability',

  computed: {
    pageReaderable(): boolean {
      return isReaderable();
    },

    value: {
      get(): boolean {
        return this.$store.getters.readabilityActive;
      },

      set(value: boolean): void {
        this.$store.dispatch('applyReadability', value);
      },
    },
  },
});
</script>

<style lang="scss" scoped>
.the-readability {
  line-height: 21px;
}

.enable-readability {
  &.custom-switch {
    font-size: 14px;
  }
}
</style>
