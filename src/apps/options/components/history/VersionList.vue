<template>
  <s-list>
    <template v-for="day in days">
      <s-text
        :key="day.label"
        as="div"
        size="label"
        variant="muted"
        class="day"
      >
        {{ day.label }}
      </s-text>

      <version-group
        v-for="group in day.entries"
        :key="group.key"
        :group="group"
        :current="currentKeys.has(group.key)"
        :compact="compact"
        :expanded="expandedKey === group.key"
        @toggle="$emit('toggle', group)"
        @restore="(version, options) => $emit('restore', version, options)"
      />
    </template>
  </s-list>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SList, SText } from '@stylebot/components';

import type { DayGroup } from './group-by-day';
import type { SiteGroup } from './group-by-site';
import VersionGroup from './VersionGroup.vue';

export default Vue.extend({
  name: 'VersionList',

  components: {
    SList,
    SText,
    VersionGroup,
  },

  props: {
    days: {
      type: Array as PropType<Array<DayGroup<SiteGroup>>>,
      required: true,
    },
    // The groups the styles are still at, newest of each profile.
    currentKeys: {
      type: Set as PropType<Set<string>>,
      required: true,
    },
    // With one site picked, rows leave out the site.
    compact: {
      type: Boolean,
      default: false,
    },
    expandedKey: {
      type: String as PropType<string | null>,
      default: null,
    },
  },
});
</script>

<style lang="scss" scoped>
.day {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 20px;
  background: var(--tab-surface);
}
</style>
