<template>
  <span class="change">
    <span v-if="nothingChanged" class="verb">
      {{ t('restore_no_changes') }}
    </span>

    <span v-for="part in parts" :key="part.key" class="part" :class="part.key">
      <span
        v-for="(segment, index) in part.segments"
        :key="index"
        :class="segment.subject ? 'subject' : 'verb'"
        v-text="segment.text"
      />
    </span>

    <s-badge v-if="restoredFrom" class="restored">
      {{ t('restore_restored') }}
    </s-badge>
  </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SBadge } from '@stylebot/components';
import type { Timestamp, VersionChange } from '@stylebot/types';

import type { Segment } from './split-around';
import { splitAround } from './split-around';

type Part = {
  key: 'added' | 'edited' | 'deleted';
  segments: Array<Segment>;
};

export default Vue.extend({
  name: 'VersionChange',

  components: {
    SBadge,
  },

  props: {
    // What this save changed about the one before it. Absent on the oldest
    // version read, which has nothing to be measured against.
    change: {
      type: Object as PropType<VersionChange | null>,
      default: null,
    },
    // Set when this save was a restore, to when the version it put back was
    // made, which marks the row as one.
    restoredFrom: {
      type: String as PropType<Timestamp | null>,
      default: null,
    },
  },

  computed: {
    /**
     * What this save did, said in the past: the row is a record of a change,
     * not of what restoring it would do. One site is named outright — a count
     * says a change happened, the name says whether it is the one you want.
     */
    parts(): Array<Part> {
      return [
        { key: 'added' as const, urls: this.change?.addedUrls ?? [] },
        { key: 'edited' as const, urls: this.change?.changedUrls ?? [] },
        { key: 'deleted' as const, urls: this.change?.removedUrls ?? [] },
      ]
        .filter(part => part.urls.length > 0)
        .map(part => ({
          key: part.key,
          segments: this.describe(part.urls, `restore_${part.key}`),
        }));
    },

    /**
     * A version read against the one before it that moved nothing says so;
     * the oldest one read has nothing to say, so it says nothing.
     */
    nothingChanged(): boolean {
      return Boolean(this.change) && this.parts.length === 0;
    },
  },

  methods: {
    /**
     * One site is named outright and several are counted, but either way the
     * subject goes through the same sentence, so what a locale puts before or
     * after it holds for both.
     */
    describe(urls: Array<string>, key: string): Array<Segment> {
      const subject =
        urls.length === 1
          ? urls[0]
          : this.t('restore_site_count', [String(urls.length)]);

      return splitAround(this.t(`${key}_site`, [subject]), subject);
    },
  },
});
</script>

<style lang="scss" scoped>
.change {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  column-gap: 14px;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.4;
}

.part {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.verb {
  color: var(--text-secondary);
}

.subject {
  font-weight: 600;
  color: var(--text-primary);
}

.added .verb {
  color: var(--success);
}

.edited .verb {
  color: var(--accent-text);
}

.restored {
  align-self: center;
}
</style>
