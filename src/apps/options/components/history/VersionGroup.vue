<template>
  <div class="group" :class="{ compact }">
    <s-list-item
      :as="expandable ? 'button' : 'div'"
      :type="expandable ? 'button' : undefined"
      :interactive="expandable"
      :compact="compact"
      :aria-expanded="expandable ? String(expanded) : undefined"
      @click="expandable && $emit('toggle')"
    >
      <template #icon><site-icon :urls="group.urls" /></template>
      <template v-if="!compact" #title>{{ label }}</template>

      <template #meta>
        <template v-for="(part, index) in metaParts">
          <span
            v-if="part.pill"
            :key="index"
            class="profile"
            :class="{ current: current && index === lastPill }"
          >
            {{ part.text }}
            <span v-if="current && index === lastPill" class="current-mark">
              · {{ t('restore_current') }}
            </span>
          </span>
          <s-text
            v-else
            :key="index"
            as="span"
            :size="textSize"
            :variant="compact ? 'default' : 'muted'"
            class="meta"
          >
            {{ part.text }}
          </s-text>
        </template>
        <s-text
          v-if="current && lastPill === -1"
          as="span"
          :size="textSize"
          variant="primary"
        >
          · {{ t('restore_current') }}
        </s-text>
      </template>

      <template #trailing>
        <span class="counts">
          <span v-if="addedLines" class="added">+{{ addedLines }}</span>
          <span v-if="removedLines" class="removed">−{{ removedLines }}</span>
        </span>

        <s-tooltip :text="exactTime" class="time">
          <s-text as="span" variant="muted" class="stamp">
            <span>{{ time }}</span>
            <span
              v-for="widest in widestTimes"
              :key="widest"
              class="sizer"
              aria-hidden="true"
            >
              {{ widest }}
            </span>
          </s-text>
        </s-tooltip>

        <chevron-down-icon
          v-if="expandable"
          :size="12"
          class="chevron"
          :class="{ up: expanded }"
        />
        <span v-else class="chevron" />
      </template>
    </s-list-item>

    <div v-if="expanded && expandable" class="details">
      <template v-if="single">
        <version-diff
          v-if="single.lines.length || addedEmpty"
          :lines="single.lines"
        />
      </template>

      <div v-else class="sites">
        <version-site
          v-for="change in changes"
          :key="change.url"
          :change="change"
          :expanded="openSite === change.url"
          :can-restore="canRestoreSite(change)"
          @toggle="openSite = openSite === change.url ? null : change.url"
          @restore="restoreSite(change)"
        />
      </div>

      <div v-if="canRestore" class="actions">
        <s-button variant="primary" @click="restore">
          {{ restoreLabel }}
        </s-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SButton, SListItem, SText, STooltip } from '@stylebot/components';
import { ChevronDownIcon } from '@stylebot/icons';
import type { ProfileAction, RestoreOptions, Version } from '@stylebot/types';

import { formatClockTime, formatDayTime, formatExact } from '@stylebot/utils';

import type { SiteGroup } from './group-by-site';
import type { SentencePart } from './sentence-parts';
import { splitSentence } from './sentence-parts';
import type { SiteChange } from './site-change';
import { getNetAction, getSiteChange } from './site-change';
import SiteIcon from '../site/SiteIcon.vue';
import VersionDiff from './VersionDiff.vue';
import VersionSite from './VersionSite.vue';

export default Vue.extend({
  name: 'VersionGroup',

  components: {
    SButton,
    SListItem,
    SText,
    STooltip,
    ChevronDownIcon,
    SiteIcon,
    VersionDiff,
    VersionSite,
  },

  props: {
    group: {
      type: Object as PropType<SiteGroup>,
      required: true,
    },
    // Whether the styles are still at this group: the newest for its
    // profile, and unchanged since.
    current: {
      type: Boolean,
      default: false,
    },
    // With one site picked, the row leaves out the site.
    compact: {
      type: Boolean,
      default: false,
    },
    expanded: {
      type: Boolean,
      default: false,
    },
  },

  data(): { openSite: string | null } {
    return { openSite: null };
  },

  computed: {
    newest(): Version {
      return this.group.versions[0];
    },

    changes(): Array<SiteChange> {
      return this.group.urls.map(url => getSiteChange(this.group, url));
    },

    // The group's one site, when it has only one.
    single(): SiteChange | null {
      return this.changes.length === 1 ? this.changes[0] : null;
    },

    // What the group did to its site's profiles, when that is all it did.
    action(): ProfileAction | null {
      return this.single ? getNetAction(this.group, this.single.url) : null;
    },

    // A row that deleted its one site or profile.
    deleted(): boolean {
      return Boolean(this.single?.deleted);
    },

    profile(): string | null {
      const profile = this.single && this.newest.css[this.single.url]?.profile;
      return profile ? this.profileName(profile.name) : null;
    },

    label(): string {
      if (this.single) {
        return this.single.url;
      }

      const count = String(this.group.urls.length);

      if (this.newest.restoredFrom) {
        return this.t('restore_restored_sites', [count]);
      }

      return this.newest.source === 'sync'
        ? this.t('restore_synced_sites', [count])
        : this.t('restore_changed_sites', [count]);
    },

    addedLines(): number {
      return this.changes.reduce((sum, change) => sum + change.added, 0);
    },

    removedLines(): number {
      return this.changes.reduce((sum, change) => sum + change.removed, 0);
    },

    // Rows that leave out the site read their one line a size up.
    textSize(): 'large' | 'body' {
      return this.compact ? 'large' : 'body';
    },

    time(): string {
      return formatClockTime(new Date(this.newest.modifiedTime));
    },

    exactTime(): string {
      return formatExact(new Date(this.newest.modifiedTime));
    },

    // The widest times in the morning and evening, which keep the counts
    // before the time lined up from row to row.
    widestTimes(): Array<string> {
      return [10, 22].map(hour =>
        formatClockTime(new Date(2000, 0, 1, hour, 58))
      );
    },

    /**
     * What happened, as a verb and the profile it happened
     * to: edited, added, deleted, renamed or restored. Several sites are
     * counted instead. Profile names are pills.
     */
    metaParts(): Array<SentencePart> {
      const dot: SentencePart = { text: '·', pill: false };

      if (!this.single) {
        return (['added', 'changed', 'deleted'] as const)
          .flatMap(status => {
            const count = this.changes.filter(
              change => change.status === status
            ).length;

            return count
              ? [
                  dot,
                  {
                    text: this.t(`restore_count_${status}`, [String(count)]),
                    pill: false,
                  },
                ]
              : [];
          })
          .slice(1);
      }

      if (this.action) {
        return this.describeAction(this.action);
      }

      if (!this.profile) {
        return [{ text: this.t('restore_deleted'), pill: false }];
      }

      return this.describeEdit(this.profile);
    },

    // Where "Current" goes: the last profile pill, if there is one.
    lastPill(): number {
      return this.metaParts.map(part => part.pill).lastIndexOf(true);
    },

    /**
     * Whether opening the row shows anything: a diff, or a way to restore.
     */
    expandable(): boolean {
      return (
        !this.single ||
        this.single.lines.length > 0 ||
        this.addedEmpty ||
        this.canRestore
      );
    },

    // A profile added with no css, which has no lines to show.
    addedEmpty(): boolean {
      return this.action?.kind === 'added' && !this.single?.lines.length;
    },

    /**
     * A row can be restored when doing so would change something: for one
     * site, as that site's rule says; for several, when any of the sites it
     * changed rather than deleted has moved on since.
     */
    canRestore(): boolean {
      return this.single
        ? this.canRestoreSite(this.single)
        : this.changes.some(
            change => !change.deleted && !this.matchesNow(change.url)
          );
    },

    restoreLabel(): string {
      if (this.deleted && this.single) {
        return this.t('restore_restore_name', [
          this.action?.kind === 'deleted'
            ? this.profileName(this.action.name)
            : this.single.url,
        ]);
      }

      return this.profile
        ? this.t('restore_restore_profile_to', [this.profile, this.time])
        : this.t('restore_restore_to', [this.time]);
    },
  },

  watch: {
    expanded(): void {
      this.openSite = null;
    },
  },

  methods: {
    matchesNow(url: string): boolean {
      return Boolean(this.newest.css[url]?.matchesNow);
    },

    /**
     * A deletion can be restored while what it deleted is still gone; any
     * other change once its site, or profile, has moved on from it.
     */
    canRestoreSite(change: SiteChange): boolean {
      const matches = this.matchesNow(change.url);
      return change.deleted ? matches : !matches;
    },

    restore(): void {
      if (this.single) {
        this.restoreSite(this.single);
        return;
      }

      // Sites the change deleted stay as they are now, not deleted again.
      const options: RestoreOptions = {
        urls: this.changes
          .filter(change => !change.deleted)
          .map(change => change.url),
      };
      this.$emit('restore', this.newest, options);
    },

    /**
     * A deletion brings back what it deleted, from just before it; any other
     * change puts its site's profile back to how it left it.
     */
    restoreSite(change: SiteChange): void {
      const profileId = this.newest.css[change.url]?.profile?.id;
      const options: RestoreOptions = {
        urls: [change.url],
        ...(change.deleted ? { before: true } : {}),
        ...(profileId ? { profileId } : {}),
      };

      // A run that ended in a deletion is undone from before its first change.
      const versions = this.group.versions;
      const from = change.deleted ? versions[versions.length - 1] : this.newest;

      this.$emit('restore', from, options);
    },

    profileName(name: string): string {
      return name || this.t('profile_default_name');
    },

    /**
     * An edit, an added site, or a restore, said of the profile it changed.
     */
    describeEdit(profile: string): Array<SentencePart> {
      const fill = (key: string, extra: Array<string> = []) =>
        splitSentence(
          substitutions => this.t(key, [...substitutions, ...extra]),
          [profile]
        );

      if (this.newest.restoredFrom) {
        return fill('restore_restored_profile_to', [
          formatDayTime(new Date(this.newest.restoredFrom)),
        ]);
      }

      return this.single?.status === 'added'
        ? fill('restore_added_profile')
        : fill('restore_edited_profile');
    },

    describeAction(action: ProfileAction): Array<SentencePart> {
      const names =
        action.kind === 'renamed' ? [action.from, action.to] : [action.name];

      return splitSentence(
        substitutions =>
          this.t(`restore_${action.kind}_profile`, substitutions),
        names.map(this.profileName)
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.compact .meta {
  @include dark-mode {
    color: color-mix(in srgb, var(--text-primary) 85%, var(--panel-surface));
  }
}

.time {
  flex: none;
}

.meta {
  @include truncate;

  flex-shrink: 1;
}

.stamp {
  display: inline-grid;
  justify-items: end;
  font-variant-numeric: tabular-nums;
}

.stamp > span {
  grid-area: 1 / 1;
}

.sizer {
  visibility: hidden;
}

.profile {
  display: inline-flex;
  gap: 4px;
  flex: none;
  padding: 3px 7px;
  border: 1px solid var(--field-border);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: var(--text-secondary);
}

.profile.current {
  border-color: transparent;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--text-primary);

  @include dark-mode {
    color: color-mix(in srgb, var(--text-primary) 85%, var(--panel-surface));
  }
}

.current-mark {
  color: var(--accent-text);
}

.counts {
  display: flex;
  overflow: hidden;
  border-radius: 5px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

.counts > span {
  padding: 2px 5px;
}

.counts .added {
  background: var(--success-background);
  color: var(--success);
}

.counts .removed {
  background: var(--danger-background);
  color: var(--danger);
}

.chevron {
  width: 12px;
  color: var(--text-faint);
}

.up {
  transform: rotate(180deg);
}

.details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 20px 20px 62px;
}

.compact .details {
  padding-left: 20px;
}

.sites {
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  overflow: clip;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
</style>
