<template>
  <div class="card">
    <s-toggle-switch size="lg" :value="enabled" @change="setEnabled">
      <s-heading as="h2" size="md">
        {{ t('let_apps_on_this_computer_control_stylebot') }}
      </s-heading>
      <s-text variant="muted" class="description">
        {{ t('let_apps_on_this_computer_control_stylebot_description') }}
      </s-text>
    </s-toggle-switch>

    <div
      v-if="enabled"
      class="status"
      :class="{ connected }"
      role="status"
      aria-live="polite"
    >
      <span class="status-dot" aria-hidden="true" />
      <s-text v-if="connected" as="span">
        {{ t('connected_to_your_terminal') }}
      </s-text>
      <template v-else>
        <s-text as="span" variant="muted">
          {{ t('not_connected_run_this_in_your_terminal') }}
        </s-text>
        <code class="command">{{ installCommand }}</code>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SToggleSwitch, SHeading, SText } from '@stylebot/components';
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
    SToggleSwitch,
    SHeading,
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
.card {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
}

.description {
  margin-top: 2px;
}

.status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 10px 0 0 48px;
}

.command {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
}

.status-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-faint);

  .connected & {
    background: var(--success);
    box-shadow: 0 0 0 3px var(--success-background);
  }
}
</style>
