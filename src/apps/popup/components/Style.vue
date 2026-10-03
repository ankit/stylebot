<template>
  <div
    v-if="header"
    class="popup-header"
    :class="{ disabled: disableToggle }"
    @click="onHeaderClick"
  >
    <s-toggle-switch
      v-model="enabled"
      size="lg"
      :disabled="disableToggle"
      @change="onChange"
    >
      <div class="popup-header-domain">{{ url }}</div>
      <template #trailing>
        <s-shortcut-chip v-if="shortcut" muted :value="shortcut" />
      </template>
    </s-toggle-switch>
  </div>

  <popup-row v-else hover :disabled="disableToggle">
    <s-toggle-switch
      v-model="enabled"
      :disabled="disableToggle"
      @change="onChange"
    >
      {{ url }}
    </s-toggle-switch>

    <span v-if="profiles.length > 1" class="profile-select" @click.stop>
      <s-select :text="activeName" :menu-min-width="160">
        <template #default="{ close }">
          <s-menu-item
            v-for="profile in profiles"
            :key="profile.id"
            :selected="profile.id === activeProfile"
            @click="
              switchProfile(profile.id);
              close();
            "
          >
            {{ displayName(profile) }}
          </s-menu-item>
        </template>
      </s-select>
    </span>
  </popup-row>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import type { ProfileSummary } from '@stylebot/saved-styles';
import PopupRow from './PopupRow.vue';
import {
  SMenuItem,
  SSelect,
  SShortcutChip,
  SToggleSwitch,
} from '@stylebot/components';
import {
  disableStyle,
  enableStyle,
  forwardClickToInput,
  setActiveProfile,
} from '../utils';

export default Vue.extend({
  name: 'StyleComponent',

  components: {
    PopupRow,
    SToggleSwitch,
    SShortcutChip,
    SSelect,
    SMenuItem,
  },

  props: {
    url: {
      type: String,
      required: true,
    },
    disableToggle: {
      type: Boolean,
    },
    initialEnabled: {
      type: Boolean,
    },
    header: {
      type: Boolean,
    },
    shortcut: {
      type: String,
      default: '',
    },
    profiles: {
      type: Array as PropType<Array<ProfileSummary>>,
      default: () => [],
    },
  },

  data(): {
    enabled: boolean;
    activeProfile: string;
  } {
    return {
      enabled: this.initialEnabled,
      activeProfile: this.profiles.find(profile => profile.active)?.id ?? '',
    };
  },

  computed: {
    activeName(): string {
      const active = this.profiles.find(
        profile => profile.id === this.activeProfile
      );

      return active ? this.displayName(active) : '';
    },
  },

  methods: {
    displayName(profile: ProfileSummary): string {
      return profile.name || this.t('profile_default_name');
    },

    switchProfile(id: string): void {
      if (id !== this.activeProfile) {
        this.activeProfile = id;
        setActiveProfile(this.url, id);
      }
    },

    onHeaderClick(event: MouseEvent): void {
      if (this.disableToggle) {
        return;
      }

      forwardClickToInput(event, this.$el);
    },

    onChange(): void {
      if (this.enabled) {
        enableStyle(this.url);
      } else {
        disableStyle(this.url);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.popup-header {
  cursor: pointer;

  &.disabled {
    cursor: default;
  }
}

.profile-select {
  flex: none;
  cursor: default;
}

.popup-header .popup-header-domain {
  position: relative;
  top: -1px;
}
</style>
