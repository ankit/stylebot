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
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SToggleSwitch, SHeading, SText } from '@stylebot/components';
import {
  hasCliPermissions,
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

  data(): { enabled: boolean } {
    return { enabled: false };
  },

  async created(): Promise<void> {
    // Permissions removed from the browser's own settings leave it off too.
    this.enabled =
      this.$store.state.options['cliAccess'] && (await hasCliPermissions());
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
</style>
