<template>
  <s-menu dense :min-width="184">
    <button class="item" @click="openShortcut">
      <icon-keyboard />
      <span class="label">{{ shortcutLabel }}</span>
      <shortcut-chip v-if="shortcutValue" small :value="shortcutValue" />
    </button>
    <button class="item" @click="openOptions">
      <icon-options />
      {{ t('view_options') }}
    </button>
    <button class="item" @click="reportIssue">
      <icon-flag />
      {{ t('report_an_issue') }}
    </button>
    <button class="item" @click="donate">
      <icon-coffee />
      {{ t('donate') }}
    </button>
  </s-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import { shortcutStore } from './shortcut-store';
import {
  openOptionsPage,
  openReportIssuePage,
  openDonatePage,
} from '@stylebot/utils';

import { SMenu, ShortcutChip } from '@stylebot/components';
import { IconOptions, IconFlag, IconCoffee, IconKeyboard } from '@stylebot/icons';

export default Vue.extend({
  name: 'MoreMenu',

  components: {
    SMenu,
    ShortcutChip,
    IconOptions,
    IconFlag,
    IconCoffee,
    IconKeyboard,
  },

  computed: {
    shortcutValue(): string {
      return shortcutStore.value();
    },

    shortcutLabel(): string {
      return this.shortcutValue ? this.t('modify_shortcut') : this.t('set_shortcut');
    },
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

    openShortcut(): void {
      this.$emit('open-shortcut');
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
  color: var(--foreground);

  &:hover {
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
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

.label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item:hover .chip {
  background: transparent;
}
</style>
