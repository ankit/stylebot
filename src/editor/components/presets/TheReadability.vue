<template>
  <feature-card :label="t('readability')" :disabled="!pageReaderable">
    <template #toggle>
      <toggle-switch
        size="lg"
        :value="value"
        :disabled="!pageReaderable"
        @change="setValue"
      >
        <template v-if="!pageReaderable" #trailing>
          <s-text as="span" size="small" variant="muted" class="articles-only">
            {{ t('articles_only') }}
          </s-text>
        </template>
      </toggle-switch>
    </template>

    <s-text variant="muted">{{ t('readability_description') }}</s-text>
  </feature-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { ToggleSwitch, SText } from '@stylebot/components';

import FeatureCard from './FeatureCard.vue';

export default Vue.extend({
  name: 'TheReadability',

  components: {
    FeatureCard,
    ToggleSwitch,
    SText,
  },

  computed: {
    pageReaderable(): boolean {
      return this.$store.state.page.readerable;
    },

    value(): boolean {
      return this.$store.getters.readabilityActive;
    },
  },

  methods: {
    setValue(value: boolean): void {
      this.$store.dispatch('applyReadability', value);
    },
  },
});
</script>

<style lang="scss" scoped>
.articles-only {
  flex: none;
}
</style>
