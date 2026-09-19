<template>
  <div class="stylebot-code-editor-iframe ready">
    <div class="code-editor-stub">Code editor stub</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CodeEditorIframe',
});
</script>

<style lang="scss">
.stylebot-code-editor-iframe {
  height: calc(100% - 10px);
}

.code-editor-stub {
  height: 100%;
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  background: var(--field-fill);
  border: 1px dashed var(--field-border);
  border-radius: 7px;
}
</style>
