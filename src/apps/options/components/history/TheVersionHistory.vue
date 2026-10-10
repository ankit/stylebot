<template>
  <div>
    <!-- Reading the history is local and immediate, so there is nothing to
         say while it happens: a spinner here only ever flashes. -->
    <template v-if="loaded">
      <s-text v-if="!sites.length" variant="muted" class="empty">
        {{ t('history_empty') }}
      </s-text>

      <template v-else>
        <site-picker
          v-if="sites.length > 1"
          :value="site"
          :sites="sites"
          class="picker"
          @input="pick"
        />

        <version-list
          :days="days"
          :current-keys="currentKeys"
          :compact="Boolean(site)"
          :expanded-key="expandedKey"
          class="list"
          @toggle="toggle"
          @restore="restore"
        />

        <div v-if="hasMore" ref="sentinel" class="sentinel" />
      </template>
    </template>

    <div v-if="toast" class="toast" role="status">
      <span>{{ toast.text }}</span>
      <button v-if="toast.entryId" type="button" class="undo" @click="undo">
        {{ t('undo') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SText } from '@stylebot/components';
import type {
  RestoreOptions,
  RestoreResult,
  VersionHistory,
  Version,
} from '@stylebot/types';
import { formatDayTime } from '@stylebot/utils';

import type { DayGroup } from './group-by-day';
import { getDayLabel, groupByDay } from './group-by-day';
import type { SiteGroup } from './group-by-site';
import { findCurrentGroups, groupBySite } from './group-by-site';
import { isCancelledOut } from './site-change';
import SitePicker from './SitePicker.vue';
import VersionList from './VersionList.vue';

// How many versions are read at a time; scrolling near the end reads more.
const PAGE_SIZE = 20;

const TOAST_FOR_MS = 6000;

// What Undo takes back: the restore's own entry, and its one profile.
type Toast = { text: string; entryId?: string; profileId?: string };

export default Vue.extend({
  name: 'TheVersionHistory',

  components: {
    SText,
    SitePicker,
    VersionList,
  },

  data(): {
    loaded: boolean;
    loading: boolean;
    // Counts reads, so a stale one can tell it was overtaken.
    reads: number;
    versions: Array<Version>;
    sites: VersionHistory['sites'];
    hasMore: boolean;
    limit: number;
    site: string | null;
    expandedKey: string | null;
    toast: Toast | null;
    timer: number | undefined;
    observer: IntersectionObserver | null;
  } {
    return {
      loaded: false,
      loading: false,
      reads: 0,
      versions: [],
      sites: [],
      hasMore: false,
      limit: PAGE_SIZE,
      site: null,
      expandedKey: null,
      toast: null,
      timer: undefined,
      observer: null,
    };
  },

  computed: {
    groups(): Array<SiteGroup> {
      return groupBySite(this.versions, this.site).filter(
        group => !isCancelledOut(group)
      );
    },

    currentKeys(): Set<string> {
      return findCurrentGroups(this.groups);
    },

    days(): Array<DayGroup<SiteGroup>> {
      return groupByDay(
        this.groups,
        group => new Date(group.versions[0].modifiedTime),
        date => getDayLabel(date, this.t)
      );
    },
  },

  created() {
    this.scan();
  },

  mounted() {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          this.loadMore();
        }
      },
      { rootMargin: '400px' }
    );
  },

  beforeDestroy() {
    window.clearTimeout(this.timer);
    this.observer?.disconnect();
  },

  methods: {
    /**
     * Reads the history for the site and length wanted now. A read that
     * finishes after a newer one started is dropped, so picking a site while
     * more is loading cannot bring the old site's rows back.
     */
    async scan(): Promise<void> {
      this.loading = true;
      const read = ++this.reads;

      const scan: VersionHistory = await this.$store.dispatch(
        'scanVersionHistory',
        { limit: this.limit, site: this.site ?? undefined }
      );

      if (read !== this.reads) {
        return;
      }

      this.versions = scan.versions;
      this.sites = scan.sites;
      this.hasMore = scan.hasMore;
      this.loaded = true;
      this.loading = false;

      if (this.site && !this.sites.some(({ url }) => url === this.site)) {
        this.pick(null);
        return;
      }

      this.$nextTick(this.watchSentinel);
    },

    /**
     * Watches the end of the list afresh after each read, since an observer
     * reports at once when it starts — so a page too short to scroll keeps
     * reading until the list reaches past the window.
     */
    watchSentinel(): void {
      const sentinel = this.$refs.sentinel as HTMLElement | undefined;

      this.observer?.disconnect();

      if (sentinel) {
        this.observer?.observe(sentinel);
      }
    },

    loadMore(): void {
      if (this.loading || !this.hasMore) {
        return;
      }

      this.limit += PAGE_SIZE;
      this.scan();
    },

    pick(site: string | null): void {
      this.site = site;
      this.limit = PAGE_SIZE;
      this.expandedKey = null;
      this.scan();
    },

    // One at a time: two open groups are two half-made decisions.
    toggle(group: SiteGroup): void {
      this.expandedKey = this.expandedKey === group.key ? null : group.key;
    },

    /**
     * The newest version read is where the restored sites are now — with a
     * site picked it is the newest one touching that site — so Undo puts
     * them back to it.
     */
    async restore(version: Version, options: RestoreOptions): Promise<void> {
      this.expandedKey = null;

      const result: RestoreResult = await this.$store.dispatch(
        'restoreVersion',
        { versionId: version.id, ...options }
      );

      await this.scan();

      if (result.ok) {
        this.showToast({
          text: this.describeRestore(version, options),
          entryId: result.entryId,
          profileId: options.profileId,
        });
      }
    },

    /**
     * What the restore put back, and to when — or just what, for one that
     * undid a change, since its time is the change's, not the state's.
     */
    describeRestore(version: Version, options: RestoreOptions): string {
      const urls = options.urls ?? [];
      const time = formatDayTime(new Date(version.modifiedTime));
      const profile = options.profileId && version.css[urls[0]]?.profile?.name;

      if (urls.length > 1) {
        return this.t('restore_sites_restored_to', [String(urls.length), time]);
      }

      if (options.before) {
        return this.t('restore_site_restored', [urls[0]]);
      }

      return typeof profile === 'string'
        ? this.t('restore_profile_on_site_restored_to', [
            profile || this.t('profile_default_name'),
            urls[0],
            time,
          ])
        : this.t('restore_site_restored_to', [urls[0], time]);
    },

    showToast(toast: Toast): void {
      window.clearTimeout(this.timer);
      this.toast = toast;
      this.timer = window.setTimeout(() => (this.toast = null), TOAST_FOR_MS);
    },

    async undo(): Promise<void> {
      if (!this.toast?.entryId) {
        return;
      }

      const { entryId, profileId } = this.toast;

      window.clearTimeout(this.timer);
      this.toast = null;

      await this.$store.dispatch('undoRestore', { entryId, profileId });
      await this.scan();
    },
  },
});
</script>

<style lang="scss" scoped>
.empty {
  display: block;
  margin-top: 24px;
}

.picker {
  margin-top: 24px;
}

.list {
  margin-top: 16px;
}

.sentinel {
  height: 1px;
}

.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 12px 12px 18px;
  border-radius: 10px;
  background: var(--text-primary);
  box-shadow: var(--menu-shadow);
  font-size: 14px;
  line-height: 1.3;
  color: var(--panel-surface);
  transform: translateX(-50%);

  @include dark-mode {
    border: 1px solid var(--menu-border);
    background: var(--menu-surface);
    color: var(--text-primary);
  }
}

.undo {
  @include button-reset;

  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: color-mix(in srgb, var(--accent) 55%, var(--panel-surface));
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, var(--panel-surface) 12%, transparent);
  }

  @include focus-ring;

  @include dark-mode {
    color: var(--accent-text);

    &:hover {
      background: var(--hover-tint);
    }
  }
}
</style>
