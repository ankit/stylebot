<template>
  <basics-section :label="t('command_line')">
    <div>
      <s-list-item padded interactive @click="onRowClick">
        <template #title>
          <h3 class="heading">
            <label for="cli-access">{{ t('allow_command_line_access') }}</label>
          </h3>
        </template>
        <template #meta>
          <s-text variant="muted" size="large" as="span">
            <span>
              <template v-for="(part, i) in descriptionParts">
                <a
                  v-if="part.link"
                  :key="i"
                  class="cli-link"
                  :href="cliGuideUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  v-text="part.text"
                />
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
          </s-text>
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

      <div v-if="enabled" class="setup">
        <ol v-if="!connected" class="steps">
          <li v-for="(step, i) in steps" :key="step.command" class="step">
            <span class="step-number" aria-hidden="true">{{ i + 1 }}</span>
            <span class="step-title">{{ step.title }}</span>
            <cli-command class="step-command" :command="step.command" />
          </li>
        </ol>

        <div class="status" :class="{ connected }" role="status">
          <span class="status-badge" aria-hidden="true">
            <s-status-dot :tone="connected ? 'success' : 'warning'" :size="8" />
          </span>
          {{ connected ? t('connected') : t('waiting_for_connection') }}
        </div>
      </div>
    </div>
  </basics-section>
</template>

<script lang="ts">
import Vue from 'vue';

import {
  SListItem,
  SStatusDot,
  SText,
  SToggleSwitch,
} from '@stylebot/components';
import {
  getCliConnected,
  hasCliPermissions,
  onCliConnectedChange,
  requestCliPermissions,
  removeCliPermissions,
} from '@stylebot/settings';
import { getSiteUrl } from '@stylebot/utils';

import BasicsSection from './BasicsSection.vue';
import CliCommand from './CliCommand.vue';

// An invisible separator, which no translation holds.
const MARK = '⁣';

export default Vue.extend({
  name: 'TheCliAccess',

  components: {
    SStatusDot,
    BasicsSection,
    CliCommand,
    SListItem,
    SToggleSwitch,
    SText,
  },

  data(): {
    enabled: boolean;
    connected: boolean;
    stopWatching: (() => void) | null;
  } {
    return {
      enabled: false,
      connected: false,
      stopWatching: null,
    };
  },

  computed: {
    cliGuideUrl(): string {
      return getSiteUrl('/cli');
    },

    descriptionParts(): Array<{ text: string; link: boolean }> {
      return this.t('allow_command_line_access_description', [MARK])
        .split(MARK)
        .flatMap((text, i) => [
          ...(i ? [{ text: this.t('stylebot_cli'), link: true }] : []),
          { text, link: false },
        ]);
    },

    steps(): Array<{ title: string; command: string }> {
      return [
        {
          title: this.t('install_the_cli'),
          command: 'npm install -g @stylebot/cli',
        },
        {
          title: this.t('connect_it_to_your_browser'),
          command: 'stylebot install',
        },
      ];
    },
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
      // The switch, its heading label and the guide link act on their own.
      if (!(event.target as Element).closest('label, a')) {
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

.cli-link {
  border-radius: 3px;
  color: var(--accent-text);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring;
}

.setup {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 20px 18px;
  border-top: 1px solid var(--panel-border);
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 8px 12px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border: 1px solid var(--field-border);
  border-radius: 50%;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
}

.step-title {
  font-size: 13px;
  line-height: 20px;
  color: var(--text-body);
}

.step-command {
  grid-column: 2;
}

.status {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  color: var(--text-body);

  &.connected {
    color: var(--success);
  }
}

.status-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--warning-background);

  .connected & {
    background: var(--success-background);
  }
}
</style>
