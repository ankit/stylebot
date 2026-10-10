<template>
  <s-list-item padded interactive @click="onRowClick">
    <template #title>
      <h2 class="heading">
        <label for="cli-access">
          {{ t('let_apps_on_this_computer_control_stylebot') }}
        </label>
      </h2>
    </template>
    <template #meta>
      <span class="details">
        <s-text variant="muted" size="large" as="span">
          {{ t('let_apps_on_this_computer_control_stylebot_description') }}
        </s-text>

        <span
          v-if="enabled"
          class="status"
          :class="{ connected }"
          role="status"
          aria-live="polite"
        >
          <span class="status-dot" aria-hidden="true" />
          <template v-if="connected">
            {{ t('connected_to_your_terminal') }}
          </template>
          <template v-else>
            {{ t('not_connected_run_this_in_your_terminal') }}
            <code class="command">{{ installCommand }}</code>
          </template>
        </span>
      </span>
    </template>

    <template #trailing>
      <s-toggle-switch
        ref="toggle"
        size="lg"
        track-end
        input-id="cli-access"
        :value="enabled"
        @change="setEnabled"
      />
    </template>
  </s-list-item>
</template>

<script lang="ts">
import Vue from 'vue';

import { SListItem, SToggleSwitch, SText } from '@stylebot/components';
import {
  getCliConnected,
  hasCliPermissions,
  onCliConnectedChange,
  requestCliPermissions,
  removeCliPermissions,
} from '@stylebot/settings';

export default Vue.extend({
  name: 'TheCliAccess',

  components: {
    SListItem,
    SToggleSwitch,
    SText,
  },

  data(): {
    enabled: boolean;
    connected: boolean;
    stopWatching: (() => void) | null;
    installCommand: string;
  } {
    return {
      enabled: false,
      connected: false,
      stopWatching: null,
      installCommand: 'stylebot install',
    };
  },

  async created(): Promise<void> {
    this.stopWatching = onCliConnectedChange(connected => {
      this.connected = connected;
    });
    this.connected = await getCliConnected();

    // Permissions removed from the browser's own settings leave it off too.
    this.enabled =
      this.$store.state.options['cliAccess'] && (await hasCliPermissions());
  },

  beforeDestroy() {
    this.stopWatching?.();
  },

  methods: {
    onRowClick(event: MouseEvent): void {
      // The switch and its heading label toggle on their own.
      if (!(event.target as Element).closest('label, .status')) {
        (this.$refs.toggle as InstanceType<typeof SToggleSwitch>).toggle();
      }
    },

    async setEnabled(value: boolean): Promise<void> {
      this.enabled = value;

      if (!value) {
        await this.$store.dispatch('setOption', {
          name: 'cliAccess',
          value: false,
        });
        await removeCliPermissions();
        return;
      }

      if (await requestCliPermissions()) {
        await this.$store.dispatch('setOption', {
          name: 'cliAccess',
          value: true,
        });
      } else {
        this.enabled = false;
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.heading {
  margin: 0;
  font: inherit;
}

.details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.status {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 0 10px 0 8px;
  border-radius: 12px;
  background: var(--field-surface);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: auto;

  &.connected {
    background: var(--success-background);
    color: var(--success);
  }
}

.command {
  font-family: var(--font-mono);
  color: var(--text-primary);
}

.status-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-faint);

  .connected & {
    background: var(--success);
  }
}
</style>
