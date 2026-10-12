<template>
  <s-list-item padded interactive @click="onRowClick">
    <template #title>
      <h3 class="heading">
        <label for="chat-option">{{ t('chat_mode') }}</label>
      </h3>
    </template>
    <template #meta>
      <s-text variant="muted" size="large" as="span">
        {{ t('chat_option_description') }}
      </s-text>
    </template>

    <template #trailing>
      <s-toggle-switch
        ref="toggle"
        size="lg"
        track-end
        input-id="chat-option"
        :value="chat"
        @change="chat = $event"
      />
    </template>
  </s-list-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { SListItem, SToggleSwitch, SText } from '@stylebot/components';

export default Vue.extend({
  name: 'TheChatOption',

  components: {
    SListItem,
    SToggleSwitch,
    SText,
  },

  computed: {
    chat: {
      get(): boolean {
        return this.$store.state.options['chat'];
      },

      set(value: boolean): void {
        this.$store.dispatch('setOption', { name: 'chat', value });
      },
    },
  },

  methods: {
    onRowClick(event: MouseEvent): void {
      // The switch and its heading label toggle on their own.
      if (!(event.target as Element).closest('label')) {
        (this.$refs.toggle as InstanceType<typeof SToggleSwitch>).toggle();
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
</style>
