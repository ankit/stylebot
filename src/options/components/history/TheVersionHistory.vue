<template>
  <div>
    <!-- Reading the history is local and immediate, so there is nothing to
         say while it happens: a spinner here only ever flashes. -->
    <template v-if="loaded">
      <s-text
        v-if="!versions.length"
        size="caption"
        variant="muted"
        class="empty"
      >
        {{ t('history_empty') }}
      </s-text>

      <version-list
        v-else
        :versions="versions"
        :changes="changes"
        :previews="previews"
        :expanded-id="expandedId"
        :current-id="currentId"
        class="list"
        @toggle="toggle"
        @restore="restore"
      />

      <div v-if="hasMore" class="more">
        <s-button size="small" @click="showAll">
          {{ t('restore_show_all', [String(total)]) }}
        </s-button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SText, SButton } from '@stylebot/components';
import { VersionChange, VersionPreview, Version } from '@stylebot/types';

import VersionList from './VersionList.vue';

// What the list opens with; the button reads past it.
const DEFAULT_LIMIT = 20;

export default Vue.extend({
  name: 'TheVersionHistory',

  components: {
    SText,
    SButton,
    VersionList,
  },

  data(): {
    loaded: boolean;
    versions: Array<Version>;
    previews: Record<string, VersionPreview>;
    changes: Record<string, VersionChange>;
    total: number;
    showingAll: boolean;
    expandedId: string | null;
  } {
    return {
      loaded: false,
      versions: [],
      previews: {},
      changes: {},
      total: 0,
      showingAll: false,
      expandedId: null,
    };
  },

  computed: {
    hasMore(): boolean {
      return this.total > this.versions.length;
    },

    // The newest version is where the styles are now.
    currentId(): string | null {
      return this.versions[0]?.id ?? null;
    },
  },

  created() {
    this.scan();
  },

  methods: {
    showAll(): Promise<void> {
      this.showingAll = true;
      return this.scan();
    },

    async scan(): Promise<void> {
      const scan = await this.$store.dispatch(
        'scanVersionHistory',
        this.showingAll ? undefined : DEFAULT_LIMIT
      );

      this.versions = scan.versions;
      this.previews = scan.previews;
      this.changes = scan.changes;
      this.total = scan.total;
      this.loaded = true;
    },

    // One at a time: two open pickers are two half-made decisions.
    toggle(version: Version): void {
      this.expandedId = this.expandedId === version.id ? null : version.id;
    },

    async restore(version: Version, urls: Array<string>): Promise<void> {
      this.expandedId = null;

      await this.$store.dispatch('restoreVersion', {
        versionId: version.id,
        urls,
      });

      await this.scan();
      this.$emit('restored');
    },
  },
});
</script>

<style lang="scss" scoped>
.empty {
  display: block;
  margin-top: 14px;
}

.list {
  margin-top: 14px;
}

.more {
  margin-top: 14px;
}
</style>
