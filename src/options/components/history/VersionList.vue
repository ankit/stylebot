<template>
  <div class="list">
    <template v-for="group in groups">
      <div :key="group.label" class="day">{{ group.label }}</div>

      <version
        v-for="version in group.entries"
        :key="version.id"
        :version="version"
        :is-current="version.id === currentId"
        :change="changes[version.id] || null"
        :preview="previews[version.id] || null"
        :expanded="expandedId === version.id"
        @toggle="$emit('toggle', version)"
        @restore="$emit('restore', version, $event)"
      />
    </template>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { Version, VersionChange, VersionPreview } from '@stylebot/types';

import type { DayGroup } from './group-by-day';
import { getDayLabel, groupByDay } from './group-by-day';
import VersionComponent from './Version.vue';

export default Vue.extend({
  name: 'VersionList',

  components: {
    Version: VersionComponent,
  },

  props: {
    versions: {
      type: Array as PropType<Array<Version>>,
      required: true,
    },
    // What each save changed, and what restoring it would do now, by id.
    changes: {
      type: Object as PropType<Record<string, VersionChange>>,
      required: true,
    },
    previews: {
      type: Object as PropType<Record<string, VersionPreview>>,
      required: true,
    },
    expandedId: {
      type: String as PropType<string | null>,
      default: null,
    },
    // The version the styles are at now.
    currentId: {
      type: String as PropType<string | null>,
      default: null,
    },
  },

  computed: {
    groups(): Array<DayGroup<Version>> {
      return groupByDay(
        this.versions,
        version => new Date(version.modifiedTime),
        date => getDayLabel(date, this.t)
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.list {
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  overflow: hidden;
}

/* The list's own border closes it, so the last row does not draw one too. */
.list > *:last-child {
  border-bottom: 0;
}

.day {
  padding: 10px 18px;
  background: var(--tab-surface);
  border-bottom: 1px solid var(--panel-border);
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-faint);
}
</style>
