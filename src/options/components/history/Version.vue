<template>
  <div class="entry">
    <div class="row" :class="{ clickable: canRestore }" @click="onRowClick">
      <span class="time" :title="exactTime">{{ time }}</span>

      <version-change
        :change="change"
        :restored-from="version.restoredFrom || null"
      />

      <span class="count">{{ siteCount }}</span>

      <!-- Both are rendered so the cell is as wide as the wider of them in
           every locale, which keeps View on one line down the list. -->
      <div class="action">
        <s-badge
          variant="accent"
          class="current"
          :class="{ sizer: !isCurrent }"
          :aria-hidden="String(!isCurrent)"
        >
          {{ t('restore_current') }}
        </s-badge>

        <button
          v-if="canRestore"
          type="button"
          class="toggle"
          :aria-expanded="String(expanded)"
          :aria-label="t('restore_restore')"
          @click.stop="$emit('toggle')"
        >
          <chevron-down-icon :size="12" :class="{ up: expanded }" />
        </button>
      </div>
    </div>

    <version-picker
      v-if="expanded && preview"
      :preview="preview"
      @restore="$emit('restore', $event)"
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SBadge } from '@stylebot/components';
import { ChevronDownIcon } from '@stylebot/icons';
import type { Version, VersionChange, VersionPreview } from '@stylebot/types';

import { formatClockTime, formatExact } from '@stylebot/utils';

import VersionChangeComponent from './VersionChange.vue';
import VersionPicker from './VersionPicker.vue';

export default Vue.extend({
  name: 'Version',

  components: {
    SBadge,
    ChevronDownIcon,
    VersionChange: VersionChangeComponent,
    VersionPicker,
  },

  props: {
    version: {
      type: Object as PropType<Version>,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    expanded: {
      type: Boolean,
      default: false,
    },
    // What this save changed about the one before it. Absent on the oldest
    // version read, which has nothing to be measured against.
    change: {
      type: Object as PropType<VersionChange | null>,
      default: null,
    },
    // What restoring it would do to the styles now. Absent until the history
    // scan reaches this version.
    preview: {
      type: Object as PropType<VersionPreview | null>,
      default: null,
    },
  },

  computed: {
    /**
     * Chrome's i18n has no plural forms, so the singular is its own string
     * rather than "1 sites".
     */
    siteCount(): string {
      if (!this.preview) {
        return '';
      }

      const count = this.preview.styleCount;

      return count === 1
        ? this.t('restore_site_count_one')
        : this.t('restore_site_count', [String(count)]);
    },

    canRestore(): boolean {
      return Boolean(this.preview) && !this.isCurrent;
    },

    date(): Date {
      return new Date(this.version.modifiedTime);
    },

    time(): string {
      return formatClockTime(this.date);
    },

    exactTime(): string {
      return formatExact(this.date);
    },
  },

  methods: {
    onRowClick(): void {
      if (this.canRestore) {
        this.$emit('toggle');
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.entry {
  border-bottom: 1px solid var(--panel-border);
}

.row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  padding: 11px 18px;
}

.row:hover {
  background: var(--card-surface);
}

.clickable {
  cursor: pointer;
}

.time {
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.count {
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
  color: var(--text-faint);
}

.action {
  display: grid;
  justify-items: end;
}

.action > * {
  grid-area: 1 / 1;
}

.sizer {
  visibility: hidden;
  pointer-events: none;
}

.current {
  justify-self: end;
}

.toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
}

.toggle:hover {
  color: var(--text-primary);
}

.up {
  transform: rotate(180deg);
}
</style>
