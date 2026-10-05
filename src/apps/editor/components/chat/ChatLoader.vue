<template>
  <div class="chat-loader" role="status">
    <span class="chat-loader-mark" aria-hidden="true">
      <span class="chat-loader-bar bar-1" />
      <span class="chat-loader-bar bar-2" />
      <span class="chat-loader-bar bar-3" />
      <span class="chat-loader-caret" />
    </span>
    <span class="chat-loader-label">{{ label }}…</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ChatLoader',

  props: {
    label: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-loader {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-loader-mark {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5px;
  width: 12px;
  flex: none;
}

.chat-loader-bar {
  display: block;
  height: 2.2px;
  border-radius: 1.1px;
  transform-origin: left center;
  animation: chat-loader-bar 1.5s cubic-bezier(0.45, 0, 0.25, 1) infinite;
}

.bar-1 {
  width: 10.3px;
  background: #ec4d86;
}

.bar-2 {
  width: 6.4px;
  background: #1c9fc4;
  animation-delay: 0.18s;
}

.bar-3 {
  width: 7.7px;
  background: #e0a218;
  animation-delay: 0.36s;
}

.chat-loader-caret {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 1.5px;
  height: 4.7px;
  border-radius: 0.7px;
  background: var(--accent);
  animation: chat-loader-caret 1s step-end infinite;
}

.chat-loader-label {
  font-weight: 500;
  font-size: 13px;
  line-height: 1.3;
  color: transparent;
  background-image: linear-gradient(
    90deg,
    var(--text-faint) 0%,
    var(--text-faint) 40%,
    var(--text-primary) 50%,
    var(--text-faint) 60%,
    var(--text-faint) 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: chat-loader-shimmer 1.8s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .chat-loader-bar,
  .chat-loader-caret,
  .chat-loader-label {
    animation: none;
  }

  .chat-loader-label {
    color: var(--text-muted);
    background: none;
  }
}

@keyframes chat-loader-bar {
  0% {
    transform: scaleX(0.18);
  }

  35%,
  70% {
    transform: scaleX(1);
  }

  100% {
    transform: scaleX(0.18);
  }
}

@keyframes chat-loader-caret {
  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

@keyframes chat-loader-shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -100% 0;
  }
}
</style>
