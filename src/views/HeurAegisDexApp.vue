<script setup lang="ts">
import ArcaneIcon from "@/components/icons/ArcaneIcon.vue";
import { HeurAegisDexMain } from "@jabez007/heur-aegis-dex";
</script>

<template>
  <div class="heur-aegis-dex-view">
    <router-link :to="{ name: 'home' }" class="home-button" title="Return to Arcanaeum" aria-label="Return to Arcanaeum">
      <ArcaneIcon name="home" :size="24" aria-hidden="true" />
      <span class="home-text">Return to Arcanaeum</span>
    </router-link>
    <div class="heur-aegis-dex-container heur-aegis-dex">
      <HeurAegisDexMain />
    </div>
  </div>
</template>

<style>
@import "@jabez007/heur-aegis-dex/style.css";
</style>

<style scoped>
.heur-aegis-dex-view {
  position: relative;
  min-height: 100vh;
  width: 100%;
}

.heur-aegis-dex-container {
  min-height: 100vh;
  width: 100%;
  background-color: #0f172a; /* Dark theme to match the rest of the site */
}

.home-button {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(10, 10, 35, 0.8);
  border: 1px solid rgba(100, 255, 218, 0.3);
  border-radius: 4px;
  color: #64ffda;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 300;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.home-button:hover,
.home-button:focus-visible {
  background: rgba(100, 255, 218, 0.1);
  border-color: #64ffda;
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(100, 255, 218, 0.2);
  outline: none;
}

.home-text {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: max-width 0.3s ease, margin 0.3s ease;
  opacity: 0;
}

.home-button:hover .home-text,
.home-button:focus-visible .home-text {
  max-width: 200px;
  opacity: 1;
}

@media (max-width: 600px) {
  .home-text {
    display: none;
  }
}
</style>
