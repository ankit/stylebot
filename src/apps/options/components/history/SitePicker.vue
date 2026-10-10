<template>
  <s-anchored-menu
    align="start"
    :current-item="currentItem"
    @open="focusSearch"
    @close="query = ''"
  >
    <template #trigger="{ toggle, open }">
      <button
        type="button"
        class="trigger"
        :class="{ open }"
        aria-haspopup="menu"
        :aria-expanded="open ? 'true' : 'false'"
        @click="toggle"
      >
        <favicon v-if="value" :url="value" />
        <span class="trigger-label">{{ value || t('restore_all_sites') }}</span>
        <chevron-down-icon :size="10" class="chevron" />
      </button>
    </template>

    <template #default="{ close }">
      <s-menu dense :min-width="300" :max-height="380">
        <input
          ref="search"
          v-model="query"
          type="search"
          class="search"
          :placeholder="t('search_sites')"
          :aria-label="t('search_sites')"
          @keydown.enter.prevent="pickFirst(close)"
        />

        <s-menu-item
          v-if="!query"
          ref="all"
          :selected="!value"
          :check="false"
          :class="{ chosen: !value }"
          role="menuitemradio"
          :aria-checked="String(!value)"
          @click="pick(null, close)"
        >
          <span class="option">
            <span class="icon-space" />
            <span class="option-label">{{ t('restore_all_sites') }}</span>
          </span>
        </s-menu-item>

        <s-menu-item
          v-for="site in matches"
          :key="site.url"
          :ref="site.url === value ? 'current' : undefined"
          :selected="site.url === value"
          :check="false"
          :class="{ chosen: site.url === value }"
          role="menuitemradio"
          :aria-checked="String(site.url === value)"
          @click="pick(site.url, close)"
        >
          <span class="option">
            <favicon :url="site.url" />
            <span class="option-label">{{ site.url }}</span>
            <s-text
              as="span"
              size="caption"
              variant="muted"
              class="option-time"
            >
              {{ when(site.modifiedTime) }}
            </s-text>
          </span>
        </s-menu-item>
      </s-menu>
    </template>
  </s-anchored-menu>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SAnchoredMenu, SMenu, SMenuItem, SText } from '@stylebot/components';
import { ChevronDownIcon } from '@stylebot/icons';
import type { VersionHistory } from '@stylebot/types';
import { formatClockTime, formatDay } from '@stylebot/utils';
import { isToday } from 'date-fns';

import Favicon from '../site/Favicon.vue';

type Site = VersionHistory['sites'][number];

/**
 * Narrows the history to one site, picked from every site it holds, newest
 * edit first, with a search for when there are many.
 */
export default Vue.extend({
  name: 'SitePicker',

  components: {
    SAnchoredMenu,
    SMenu,
    SMenuItem,
    SText,
    ChevronDownIcon,
    Favicon,
  },

  props: {
    sites: {
      type: Array as PropType<Array<Site>>,
      required: true,
    },
    // The picked site, or null for every site.
    value: {
      type: String as PropType<string | null>,
      default: null,
    },
  },

  data(): { query: string } {
    return { query: '' };
  },

  computed: {
    matches(): Array<Site> {
      const query = this.query.trim().toLowerCase();

      return query
        ? this.sites.filter(({ url }) => url.toLowerCase().includes(query))
        : this.sites;
    },
  },

  methods: {
    /**
     * The menu shows its panel only once it has placed it, a frame after
     * opening, and a hidden field cannot take focus.
     */
    focusSearch(): void {
      requestAnimationFrame(() => {
        (this.$refs.search as HTMLInputElement | undefined)?.focus();
      });
    },

    // The time for today's edits, the day for older ones.
    when(modifiedTime: string): string {
      const date = new Date(modifiedTime);
      return isToday(date) ? formatClockTime(date) : formatDay(date);
    },

    currentItem(): HTMLElement | null {
      const ref = this.value ? this.$refs.current : this.$refs.all;
      const item = Array.isArray(ref) ? ref[0] : ref;

      return (item as Vue | undefined)?.$el as HTMLElement | null;
    },

    pick(site: string | null, close: () => void): void {
      this.$emit('input', site);
      close();
    },

    pickFirst(close: () => void): void {
      if (this.matches.length) {
        this.pick(this.matches[0].url, close);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.trigger {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  box-sizing: border-box;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;

  &:hover,
  &.open {
    background: var(--hover-tint);
  }

  @include focus-ring;
}

.trigger-label {
  @include truncate;
}

.chevron {
  flex-shrink: 0;
  color: var(--text-faint);
}

.search {
  @include field-border(6px);

  width: 100%;
  margin-bottom: 4px;
  padding: 7px 10px;
  box-sizing: border-box;
  background: var(--field-surface);
  font: inherit;
  font-size: 13px;
  color: var(--text-primary);

  &::placeholder {
    color: var(--field-placeholder);
  }

  &:focus {
    @include field-active-border;

    outline: none;
  }
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.option-label {
  @include truncate;

  flex: 1;
}

.icon-space {
  flex-shrink: 0;
  width: 16px;
}

.menu-item.chosen,
.menu-item.chosen:hover {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.option-time {
  flex-shrink: 0;
}
</style>
