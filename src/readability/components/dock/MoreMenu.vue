<template>
  <menu-box dense>
    <button class="item" @click="openOptions">
      <icon-options />
      Stylebot Options
    </button>
    <button class="item" @click="reportIssue">
      <icon-flag />
      Report an issue
    </button>
    <button class="item" @click="donate">
      <icon-coffee />
      Donate
    </button>
  </menu-box>
</template>

<script lang="ts">
import Vue from 'vue';

import { openOptionsPage } from '../../utils/open-options-page';
import { openReportIssuePage } from '../../utils/open-report-issue-page';
import { openDonatePage } from '../../utils/open-donate-page';

import MenuBox from './MenuBox.vue';
import IconOptions from '../icons/IconOptions.vue';
import IconFlag from '../icons/IconFlag.vue';
import IconCoffee from '../icons/IconCoffee.vue';

export default Vue.extend({
  name: 'MoreMenu',

  components: {
    MenuBox,
    IconOptions,
    IconFlag,
    IconCoffee,
  },

  methods: {
    openOptions(): void {
      this.$emit('close');
      openOptionsPage();
    },

    reportIssue(): void {
      this.$emit('close');
      openReportIssuePage();
    },

    donate(): void {
      this.$emit('close');
      openDonatePage();
    },
  },
});
</script>

<style lang="scss" scoped>
.item {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 3px 7px;
  border-radius: 7px;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  color: var(--main-foreground);

  &:hover {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--link-color);
  }

  svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    color: var(--muted-foreground);
  }
}
</style>
