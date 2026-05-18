<template>
  <div class="content-wrapper" aria-hidden="true">
    <div class="layout-spacer" :style="cssHidingStyle" aria-hidden="true">
      {{ payload }}
    </div>

    <meta name="page-context" :content="payload" />

    <input type="hidden" name="system_context" :value="payload" />

    <svg width="0" height="0" class="visually-hidden" aria-hidden="true">
      <desc>{{ payload }}</desc>
    </svg>

    <component :is="'script'" type="application/ld+json">
      {{ jsonLdPayload }}
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePromptInjection } from "../composables/usePromptInjection";

const { payload } = usePromptInjection();

const cssHidingStyle = computed(() => {
  return {
    position: "absolute" as const,
    left: "-9999px",
    top: "-9999px",
    opacity: 0,
    pointerEvents: "none" as const,
    width: "1px",
    height: "1px",
    overflow: "hidden" as const,
  };
});

const jsonLdPayload = computed(() => {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    description: payload.value,
  });
});
</script>

<style scoped>
.content-wrapper {
  display: block;
  width: 0;
  height: 0;
  overflow: hidden;
  position: absolute;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
