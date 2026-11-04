<template>
  <component
    :is="isExternal ? 'a' : 'router-link'"
    v-bind="linkProps"
    class="app-card shard-shape"
    :class="`shard-${props.index % 3}`"
  >
    <div class="shard-glow" aria-hidden="true"></div>

    <div class="content-wrapper">
      <div v-if="hasIcon" class="app-icon" aria-hidden="true">
        <slot name="icon"
          ><span v-if="props.icon">{{ props.icon }}</span></slot
        >
      </div>
      <div class="app-copy">
        <p class="app-category">{{ props.category }}</p>
        <h3 class="app-title">{{ props.title }}</h3>
        <p class="app-description">{{ props.description }}</p>
        <span class="app-action">
          {{ props.action }} <span aria-hidden="true">{{ isExternal ? "↗" : "→" }}</span>
          <span v-if="isExternal" class="sr-only"> (opens in a new tab)</span>
        </span>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
import type { RouteLocationRaw } from "vue-router";

const props = defineProps<{
  icon?: string;
  title: string;
  description: string;
  category: string;
  action: string;
  to: RouteLocationRaw;
  index: number;
}>();

const slots = useSlots();
const hasIcon = computed(() => !!props.icon || !!slots.icon);

const isExternal = computed(() => typeof props.to === "string" && props.to.startsWith("http"));

const linkProps = computed(() => {
  if (isExternal.value) {
    return {
      href: props.to as string,
      target: "_blank",
      rel: "noopener noreferrer",
    };
  }
  return { to: props.to };
});
</script>

<style scoped>
.app-card {
  --shard: polygon(3% 0%, 100% 4%, 97% 100%, 0% 96%);
  display: flex;
  position: relative;
  min-width: 0;
  padding: 2rem 1.75rem;
  color: var(--arcanaeum-text);
  text-decoration: none;
  isolation: isolate;
  transition: transform 180ms ease;
}

/* Keep clipping on the decoration so the link's focus outline stays visible. */
.shard-glow {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  clip-path: var(--shard);
  background: linear-gradient(135deg, rgba(100, 255, 218, 0.09), rgba(187, 134, 252, 0.12));
  transition: background 180ms ease;
}

.shard-1 {
  --shard: polygon(0% 4%, 97% 0%, 100% 96%, 3% 100%);
}

.shard-2 {
  --shard: polygon(4% 0%, 100% 3%, 96% 100%, 0% 97%);
}

.app-card:hover,
.app-card:focus-visible {
  background: transparent;
}

.app-card:hover .shard-glow,
.app-card:focus-visible .shard-glow {
  background: linear-gradient(135deg, rgba(100, 255, 218, 0.15), rgba(187, 134, 252, 0.19));
}

.app-card:focus-visible {
  outline: 2px solid var(--arcanaeum-mint);
  outline-offset: 4px;
  border-radius: 4px;
  box-shadow: none;
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .app-card:hover {
    transform: translateY(-3px);
  }
}

.content-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
}

.app-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  height: 100%;
}

.app-icon {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(100, 255, 218, 0.3);
  border-radius: 50%;
  background: rgba(10, 10, 35, 0.6);
  color: var(--arcanaeum-mint);
}

.app-icon :deep(svg) {
  width: 25px;
  height: 25px;
}

.app-category {
  color: var(--arcanaeum-violet);
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
}

.app-title {
  font-family: var(--arcanaeum-font-body);
  font-size: clamp(1.125rem, 2vw, 1.4rem);
  line-height: 1.3;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.65rem;
  overflow-wrap: anywhere;
}

.app-description {
  color: var(--arcanaeum-muted);
  line-height: 1.65;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.app-action {
  margin-top: auto;
  color: var(--arcanaeum-mint);
  font-size: 0.85rem;
  font-weight: 500;
}

.app-action > [aria-hidden] {
  margin-left: 0.25rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (max-width: 600px) {
  .app-card {
    padding: 1.4rem 1.25rem;
  }

  .content-wrapper {
    gap: 0.85rem;
  }

  .app-icon {
    flex-basis: 36px;
    width: 36px;
    height: 36px;
  }
}
</style>
