<template>
  <div class="box-model">
    <box-model-ring kind="margin" :label="t('margin')">
      <box-model-ring kind="padding" :label="t('padding')" class="padding">
        <div class="box-model-content">
          <length
            class="box-size-field"
            property="width"
            unit=""
            :aria-label="t('width')"
          />
          <x-icon class="box-size-times" :size="12" aria-hidden="true" />
          <length
            class="box-size-field"
            property="height"
            unit=""
            :aria-label="t('height')"
          />
        </div>
      </box-model-ring>
    </box-model-ring>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { XIcon } from '@stylebot/icons';

import Length from '../Length.vue';
import BoxModelRing from './BoxModelRing.vue';

export default Vue.extend({
  name: 'BoxModel',

  components: {
    BoxModelRing,
    Length,
    XIcon,
  },
});
</script>

<style lang="scss" scoped>
.box-model {
  --box-margin: #fbe1c4;
  --box-margin-edge: #e8b47c;
  --box-padding: #dce6b5;
  --box-padding-edge: #a9b86c;
  --box-content: #c2dbe2;
  --box-content-edge: #7fa9b4;
  --box-margin-label: #8a5a26;
  --box-padding-label: #5a6a24;
  --box-label: #5f5a52;
  --box-value: var(--field-placeholder);

  padding: 4px 0 8px;

  @include dark-mode {
    --box-margin: #2f251c;
    --box-margin-edge: #8a6339;
    --box-padding: #232c1d;
    --box-padding-edge: #5d7a3f;
    --box-content: #1b2a33;
    --box-content-edge: #3f6e86;
    --box-margin-label: #d9a066;
    --box-padding-label: #a3c47e;
    --box-label: #9aa3ae;
    --box-value: #a3aab6;
  }
}

.padding {
  flex: 1;
}

.box-model-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 3px;
  border: 1px solid var(--box-content-edge);
  border-radius: 4px;
  background: var(--box-content);
}
.box-size-field.number-field {
  flex: none;
  width: 40px;
  height: 22px;
  background: var(--card-surface);

  ::v-deep .number-input::placeholder {
    color: var(--box-value);
  }

  &:has(.number-input:placeholder-shown):not(:hover):not(:focus-within) {
    border-color: transparent;
  }

  &:has(.number-input:placeholder-shown):hover:not(:focus-within) {
    border-color: var(--field-border-hover);
  }

  ::v-deep .number-input {
    padding: 0 2px;
    text-align: center;
  }
}

.box-size-times {
  flex: none;
  margin: 0 2px;
  color: var(--box-label);
}
</style>
