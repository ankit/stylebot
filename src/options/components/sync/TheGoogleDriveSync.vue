<template>
  <div>
    <s-card class="card">
      <div class="header">
        <div class="status">
          <span class="title">
            {{
              googleDriveSyncEnabled
                ? t('sync_connected_title')
                : t('sync_disconnected_title')
            }}
          </span>

          <template v-if="googleDriveSyncEnabled">
            <s-badge v-if="needsAuth" variant="danger">
              {{ t('sync_needs_sign_in') }}
            </s-badge>
            <s-badge v-else-if="syncInProgress" variant="muted">
              <arrow-repeat-icon :size="12" spinning />
              {{ t('sync_in_progress') }}
            </s-badge>
            <s-badge
              v-else-if="googleDriveSyncLastModifiedTime"
              variant="success"
            >
              <span class="dot" />
              {{ t('synced_at_time', [googleDriveSyncLastModifiedTime]) }}
            </s-badge>
          </template>

          <s-text v-else variant="muted" class="subtitle">
            {{ t('sync_not_connected') }}
          </s-text>
        </div>

        <s-button
          v-if="googleDriveSyncEnabled"
          :disabled="syncInProgress"
          @click="syncWithGoogleDrive"
        >
          <arrow-repeat-icon :size="15" :spinning="syncInProgress" />
          <span>{{ t('sync_now') }}</span>
        </s-button>
      </div>

      <dl v-if="googleDriveSyncEnabled" class="rows">
        <div class="row">
          <dt>{{ t('sync_saved_to') }}</dt>
          <dd class="saved-to">
            <template v-if="account">
              <span>{{ account.email }}</span>
              <span class="separator">›</span>
            </template>
            <a
              v-if="googleDriveSyncViewLink"
              class="path"
              :href="googleDriveSyncViewLink"
              :title="t('sync_open_in_drive')"
              target="_blank"
            >
              {{ syncFilePath }}
              <external-link-icon aria-hidden="true" />
            </a>
            <span v-else class="path">{{ syncFilePath }}</span>
          </dd>

          <s-link-button @click="googleDriveSyncEnabled = false">
            {{ t('sync_disconnect') }}
          </s-link-button>
        </div>

        <div class="row">
          <dt>{{ t('sync_schedule') }}</dt>
          <dd>{{ t('sync_schedule_value', [String(syncPeriodMinutes)]) }}</dd>
        </div>
      </dl>

      <ul v-else class="services">
        <li class="service">
          <div class="service-text">
            <div class="service-name">{{ t('google_drive') }}</div>
            <s-text variant="muted">
              {{ t('sync_google_drive_description', [syncFileName]) }}
            </s-text>
          </div>
          <s-button variant="primary" @click="googleDriveSyncEnabled = true">
            {{ t('sync_connect') }}
          </s-button>
        </li>
      </ul>
    </s-card>

    <div v-if="conflicts.length" class="conflicts">
      <s-heading as="h3" size="md">{{ t('sync_conflicts_title') }}</s-heading>
      <s-text variant="muted" class="description">
        {{ t('sync_conflicts_description') }}
      </s-text>

      <ul class="conflict-list">
        <li v-for="conflict in conflicts" :key="conflict.url" class="conflict">
          <span class="conflict-url">{{ conflict.url }}</span>
          <s-button variant="ghost" @click="$emit('edit', conflict.url)">
            {{ t('sync_conflict_review') }}
          </s-button>
          <s-button variant="ghost" @click="dismissConflict(conflict.url)">
            {{ t('sync_conflict_dismiss') }}
          </s-button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  SBadge,
  SButton,
  SCard,
  SHeading,
  SLinkButton,
  SText,
} from '@stylebot/components';
import { ArrowRepeatIcon, ExternalLinkIcon } from '@stylebot/icons';
import type { SyncAccount, SyncConflict } from '@stylebot/types';
import { formatSyncTime } from '@stylebot/utils';
import {
  SYNC_FILE_PATH,
  SYNC_FILE_NAME,
  SYNC_PERIOD_MINUTES,
} from '@stylebot/sync';

export default Vue.extend({
  name: 'TheGoogleDriveSync',

  components: {
    SBadge,
    SButton,
    SCard,
    SLinkButton,
    ArrowRepeatIcon,
    ExternalLinkIcon,
    SHeading,
    SText,
  },

  data(): {
    syncPeriodMinutes: number;
    syncFilePath: string;
    syncFileName: string;
  } {
    return {
      syncPeriodMinutes: SYNC_PERIOD_MINUTES,
      syncFilePath: SYNC_FILE_PATH,
      syncFileName: SYNC_FILE_NAME,
    };
  },

  computed: {
    syncInProgress(): boolean {
      return this.$store.state.syncInProgress;
    },

    needsAuth(): boolean {
      return this.$store.state.googleDriveSyncNeedsAuth;
    },

    conflicts(): Array<SyncConflict> {
      return this.$store.state.googleDriveSyncState?.conflicts ?? [];
    },

    account(): SyncAccount | undefined {
      return this.$store.state.googleDriveSyncState?.account;
    },

    googleDriveSyncEnabled: {
      get(): boolean {
        return this.$store.state.googleDriveSyncEnabled;
      },

      set(val: boolean) {
        this.$store.dispatch('setGoogleDriveSyncEnabled', val);
      },
    },

    googleDriveSyncViewLink(): string {
      return this.$store.state.googleDriveSyncState?.metadata.webViewLink ?? '';
    },

    // lastSyncedAt, not the file's modifiedTime: the latter is Drive's revision
    // marker and can predate the last time this machine actually checked.
    googleDriveSyncLastModifiedTime(): string {
      return formatSyncTime(
        this.$store.state.googleDriveSyncState?.lastSyncedAt
      );
    },
  },

  methods: {
    syncWithGoogleDrive() {
      return this.$store.dispatch('syncWithGoogleDrive');
    },

    dismissConflict(url: string) {
      return this.$store.dispatch('dismissSyncConflict', url);
    },
  },
});
</script>

<style lang="scss" scoped>
.card {
  margin-top: 20px;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: var(--hover-tint);
  border-bottom: 1px solid var(--panel-border);
}

.status {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px 10px;
}

.title {
  font-size: 14px;
  font-weight: 600;
}

.subtitle {
  flex-basis: 100%;
}

.services {
  margin: 0;
  padding: 0;
  list-style: none;
}

.service {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
}

.service-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.service-name {
  font-size: 14px;
  font-weight: 600;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: currentColor;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 16px 18px;
}

.row {
  display: flex;
  align-items: baseline;
  gap: 16px;

  dt {
    flex: none;
    width: 110px;
    font-size: 13px;
    color: var(--text-muted);
  }

  dd {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
  }
}

.saved-to {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.separator {
  color: var(--text-muted);
}

.path {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--accent-text);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.description {
  margin-top: 3px;
}

.conflicts {
  margin-top: 16px;
  padding: 14px 18px;
  background: var(--info);
  border: 1px solid var(--info-border);
  border-radius: 12px;
}

.conflict-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.conflict {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.conflict-url {
  @include truncate;

  flex: 1;
  min-width: 0;
  font-size: 14px;
}
</style>
