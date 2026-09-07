<template>
  <b-list-group-item
    class="full-row-toggle"
    :class="{ disabled }"
    @click="onRowClick"
  >
    <b-form-checkbox
      ref="checkbox"
      v-model="readability"
      switch
      :disabled="disabled"
      @change="onChange"
    >
      <div>{{ t('readability') }}</div>
      <div v-if="domain" class="readability-domain">{{ domain }}</div>
    </b-form-checkbox>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { ToggleReadabilityForTab } from '@stylebot/types';

export default Vue.extend({
  name: 'Readability',
  props: {
    domain: {
      type: String,
      default: '',
    },
    initialReadability: Boolean,
    disabled: Boolean,
  },

  data(): {
    readability: boolean;
  } {
    return {
      readability: this.initialReadability,
    };
  },

  watch: {
    initialReadability(newVal: boolean): void {
      this.readability = newVal;
    },
  },

  methods: {
    onRowClick(event: MouseEvent): void {
      if (this.disabled) {
        return;
      }

      const target = event.target as HTMLElement;

      // Already handled natively by the label/input itself.
      if (target.closest('label, input')) {
        return;
      }

      const checkbox = this.$refs.checkbox as Vue;
      const input = checkbox.$el.querySelector('input');
      input?.click();
    },

    onChange(): void {
      this.$emit('change', this.readability);

      chrome.tabs.query({ active: true }, ([tab]) => {
        if (tab.id) {
          const message: ToggleReadabilityForTab = {
            name: 'ToggleReadabilityForTab',
          };

          chrome.tabs.sendMessage(tab.id, message);
        }
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.readability-domain {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}
</style>
