<template>
  <div class="site">
    <button
      type="button"
      class="row"
      :aria-expanded="String(expanded)"
      @click="$emit('toggle')"
    >
      <favicon :url="change.url" />

      <span class="title">
        <s-text as="span" size="large" class="url">{{ change.url }}</s-text>
        <s-badge v-if="change.status !== 'changed'">
          {{ t(`restore_${change.status}`) }}
        </s-badge>
      </span>

      <span class="counts">
        <span v-if="change.added" class="added">+{{ change.added }}</span>
        <span v-if="change.removed" class="removed">−{{ change.removed }}</span>
      </span>

      <chevron-down-icon :size="12" class="chevron" :class="{ up: expanded }" />
    </button>

    <div v-if="expanded" class="details">
      <version-diff :lines="change.lines" />

      <div v-if="canRestore">
        <s-button size="small" @click="$emit('restore')">
          {{ t('restore_restore_this_site') }}
        </s-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SBadge, SButton, SText } from '@stylebot/components';
import { ChevronDownIcon } from '@stylebot/icons';

import Favicon from './Favicon.vue';
import type { SiteChange } from './site-change';
import VersionDiff from './VersionDiff.vue';

/**
 * One site of a change that touched several, opening onto its own diff.
 */
export default Vue.extend({
  name: 'VersionSite',

  components: {
    SBadge,
    SButton,
    SText,
    ChevronDownIcon,
    Favicon,
    VersionDiff,
  },

  props: {
    change: {
      type: Object as PropType<SiteChange>,
      required: true,
    },
    expanded: {
      type: Boolean,
      default: false,
    },
    canRestore: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.site + .site {
  border-top: 1px solid var(--panel-border);
}

.row {
  @include button-reset;

  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto 12px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  text-align: start;
  cursor: pointer;

  &:hover {
    background: var(--card-surface);
  }

  @include focus-ring;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.url {
  @include truncate;
}

.counts {
  display: flex;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

.added {
  color: var(--success);
}

.removed {
  color: var(--danger);
}

.chevron {
  color: var(--text-faint);
}

.up {
  transform: rotate(180deg);
}

.details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 12px 12px 40px;
}
</style>
