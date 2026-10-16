<template>
  <s-list-item padded>
    <template #title>
      <h3 class="heading">{{ t('editor_position') }}</h3>
    </template>
    <template #meta>
      <s-text variant="muted" size="large" as="span">
        {{ t('position_description') }}
      </s-text>
    </template>

    <template #trailing>
      <s-segmented-control
        fit
        size="large"
        :value="dockLocation"
        :options="dockOptions"
        @change="dockLocation = $event"
      >
        <template #option="{ option }">
          <span class="option">
            <component :is="option.icon" :size="14" />
            {{ option.label }}
          </span>
        </template>
      </s-segmented-control>
    </template>
  </s-list-item>
</template>

<script lang="ts">
import Vue from 'vue';

import { SListItem, SSegmentedControl, SText } from '@stylebot/components';
import {
  DockLeftIcon,
  DockRightIcon,
  SidePanelIcon,
  UndockIcon,
} from '@stylebot/icons';
import type { StylebotDockLocation, StylebotLayout } from '@stylebot/types';
import {
  detectChromiumVariant,
  getChromiumVariant,
  doesSidePanelWorkInChromiumVariant,
} from '@stylebot/utils';
import {
  isSidePanelGranted,
  supportsEditorSidePanel,
} from '@stylebot/side-panel';
import type { ChromiumVariant } from '@stylebot/utils';

import { grantSidePanel } from '../../utils';

type DockOption = {
  value: StylebotDockLocation;
  icon: string;
  label: string;
};

export default Vue.extend({
  name: 'ThePosition',

  components: {
    SListItem,
    SSegmentedControl,
    SText,
    DockLeftIcon,
    DockRightIcon,
    SidePanelIcon,
    UndockIcon,
  },

  data(): { chromiumVariant: ChromiumVariant | undefined } {
    return { chromiumVariant: undefined };
  },

  computed: {
    hasSidePanel(): boolean {
      return (
        supportsEditorSidePanel() &&
        doesSidePanelWorkInChromiumVariant(this.chromiumVariant)
      );
    },

    layout(): StylebotLayout {
      return this.$store.state.options.layout;
    },

    dockLocation: {
      get(): StylebotDockLocation {
        const { dockLocation } = this.layout;
        // Without a side panel, the background opens the editor on the right.
        return dockLocation === 'sidepanel' && !this.hasSidePanel
          ? 'right'
          : dockLocation;
      },

      set(dockLocation: StylebotDockLocation): void {
        this.$store.dispatch('setOption', {
          name: 'layout',
          value: { ...this.layout, dockLocation },
        });

        if (dockLocation === 'sidepanel' && !isSidePanelGranted()) {
          grantSidePanel();
        }
      },
    },

    dockOptions(): Array<DockOption> {
      const separateWindow: DockOption = {
        value: 'window',
        icon: 'undock-icon',
        label: this.t('window'),
      };

      const inPage: Array<DockOption> = [
        { value: 'left', icon: 'dock-left-icon', label: this.t('left') },
        { value: 'right', icon: 'dock-right-icon', label: this.t('right') },
      ];

      if (!this.hasSidePanel) {
        return [...inPage, separateWindow];
      }

      return [
        {
          value: 'sidepanel',
          icon: 'side-panel-icon',
          label: this.t('side_panel'),
        },
        separateWindow,
        ...inPage,
      ];
    },
  },

  created() {
    const setChromiumVariant = (variant: ChromiumVariant | undefined) => {
      this.chromiumVariant = this.chromiumVariant ?? variant;
    };

    getChromiumVariant().then(setChromiumVariant, () => undefined);
    detectChromiumVariant().then(setChromiumVariant, () => undefined);
  },
});
</script>

<style lang="scss" scoped>
.heading {
  margin: 0;
  font: inherit;
}

.option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
