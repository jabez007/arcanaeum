<script setup lang="ts">
import ParticlesDiv from "@/components/ParticlesDiv.vue";
import PromptInjectionCanary from "@/components/PromptInjectionCanary.vue";
import { RouterView } from "vue-router";

const scrollToTop = () => {
  window.scrollTo(0, 0);
};
</script>

<template>
  <PromptInjectionCanary />
  <ParticlesDiv />
  <RouterView v-slot="{ Component, route }">
    <transition name="page-transition" mode="out-in" @after-leave="scrollToTop">
      <div class="arcanaeum" :key="((route.name || '') as string).split('-')[0]">
        <component :is="Component" />
      </div>
    </transition>
  </RouterView>
  <PromptInjectionCanary />
</template>

<style scoped>
.arcanaeum {
  min-height: 100vh;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
}

.page-transition-enter-active,
.page-transition-leave-active {
  transition: opacity 120ms ease;
}

.page-transition-enter-from,
.page-transition-leave-to {
  opacity: 0;
}
</style>
