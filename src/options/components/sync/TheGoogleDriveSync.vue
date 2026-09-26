<template>
  <div>
    <div class="card">
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
            <span v-if="needsAuth" class="pill danger">
              {{ t('sync_needs_sign_in') }}
            </span>
            <span v-else-if="syncInProgress" class="pill muted">
              <arrow-repeat-icon :size="12" spinning />
              {{ t('sync_in_progress') }}
            </span>
            <span v-else-if="googleDriveSyncLastModifiedTime" class="pill ok">
              <span class="dot" />
              {{ t('synced_at_time', [googleDriveSyncLastModifiedTime]) }}
            </span>
          </template>

          <span v-else class="subtitle">{{ t('sync_not_connected') }}</span>
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
              <svg
                class="external"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M4.5 2.5h5v5" />
                <path d="M9.5 2.5 3 9" />
              </svg>
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
            <div class="service-description">
              {{ t('sync_google_drive_description', [syncFileName]) }}
            </div>
          </div>
          <s-button variant="primary" @click="googleDriveSyncEnabled = true">
            {{ t('sync_connect') }}
          </s-button>
        </li>
      </ul>
    </div>

    <div v-if="conflicts.length" class="conflicts">
      <heading as="h3" size="sm">{{ t('sync_conflicts_title') }}</heading>
      <s-text size="caption" variant="muted" class="description">
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
import { Heading, SText, SButton, SLinkButton } from '@stylebot/components';
import { ArrowRepeatIcon } from '@stylebot/icons';
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
    SButton,
    SLinkButton,
    ArrowRepeatIcon,
    Heading,
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
  border: 1px solid var(--panel-border);
  border-radius: 12px;
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
  font-size: 15px;
  font-weight: 600;
}

.subtitle {
  flex-basis: 100%;
  font-size: 13px;
  line-height: 1.45;
  color: var(--text-muted);
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
}

.service-name {
  font-size: 14px;
  font-weight: 600;
}

.service-description {
  margin-top: 2px;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--text-muted);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text-muted);
}

.pill.ok {
  color: var(--success);
  background: var(--success-background);
  border-color: var(--success-border);
}

.pill.danger {
  color: var(--danger);
  background: var(--danger-background);
  border-color: var(--danger-border);
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
    font-size: 13.5px;
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
  font-size: 12.5px;
  color: var(--accent-text);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.external {
  width: 11px;
  height: 11px;
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
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
</style>
