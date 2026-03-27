<script setup lang="ts">
import AppCard from "@/components/AppCard.vue";
import { onMounted, onUnmounted, ref } from "vue";

const prefersReducedMotion = ref(false);
let mediaQuery: MediaQueryList | null = null;

const handleMotionChange = (e: MediaQueryListEvent | MediaQueryList) => {
  prefersReducedMotion.value = e.matches;
};

onMounted(() => {
  mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  handleMotionChange(mediaQuery);
  mediaQuery.addEventListener("change", handleMotionChange);
});

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener("change", handleMotionChange);
  }
});
</script>

<template>
  <div class="floating-orbs">
    <div class="orb" aria-hidden="true" role="presentation"></div>
    <div class="orb" aria-hidden="true" role="presentation"></div>
    <div class="orb" aria-hidden="true" role="presentation"></div>
    <div class="orb" aria-hidden="true" role="presentation"></div>
    <div class="orb" aria-hidden="true" role="presentation"></div>
  </div>
  <div class="container constellation-container">
    <!-- Etheric Constellation Lines -->
    <div class="ether-lines" aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(100, 255, 218, 0.2)" />
            <stop offset="50%" stop-color="rgba(187, 134, 252, 0.4)" />
            <stop offset="100%" stop-color="rgba(100, 255, 218, 0.2)" />
          </linearGradient>
        </defs>
        <path d="M200,200 L600,150 L1000,250 L800,600 L400,550 Z" 
              stroke="url(#lineGrad)" 
              stroke-width="1.5" 
              fill="none" 
              stroke-dasharray="1000" 
              stroke-dashoffset="1000">
          <animate v-if="!prefersReducedMotion" 
                   attributeName="stroke-dashoffset" from="1000" to="0" dur="5s" fill="freeze" />
        </path>
        <circle cx="200" cy="200" r="3" fill="#64ffda" opacity="0.5" />
        <circle cx="600" cy="150" r="3" fill="#64ffda" opacity="0.5" />
        <circle cx="1000" cy="250" r="3" fill="#64ffda" opacity="0.5" />
        <circle cx="800" cy="600" r="3" fill="#64ffda" opacity="0.5" />
        <circle cx="400" cy="550" r="3" fill="#64ffda" opacity="0.5" />
      </svg>
    </div>

    <header>
      <h1 class="title">Archons' Arcanaeum</h1>
      <p class="subtitle">Navigate the Crystalline Realms</p>
    </header>
    <div class="app-grid">
      <AppCard icon="🔏" title="CryptoTron" :index="0"
        description="Interactive ciphers in a cyberpunk digital laboratory."
        :to="{ name: 'cryptotron-home' }" />
      <AppCard icon="🫑" title="The Forgotten Pepper" :index="1"
        description="A bold culinary blog where ingredients meet design."
        to="https://theforgottenpepper.com" />
      <AppCard icon="📓" title="Commits & Conjurations" :index="2"
        description="Lab notes of a dev with a flair for the arcane."
        :to="{ name: 'BlogList' }" />
      <AppCard icon="🧙‍♂️ " title="Meet the Vice Magus" :index="3"
        description="Who's behind the glyphs? Learn more about the conjurer."
        :to="{ name: 'about' }" />
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/orbs.css";

.constellation-container {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ether-lines {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 1000px;
  height: 80%;
  z-index: 0;
  pointer-events: none;
  opacity: 0.4;
}

header {
  position: relative;
  z-index: 10;
  text-align: center;
  margin-bottom: 5rem;
}

.title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 300;
  background: linear-gradient(45deg, #64ffda, #bb86fc, #03dac6);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease-in-out infinite;
  text-shadow: 0 0 30px rgba(100, 255, 218, 0.3);
  margin-bottom: 1rem;
}

.subtitle {
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: #bb86fc;
  opacity: 0.9;
  font-weight: 300;
}

@keyframes gradientShift {

  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 2rem;
  margin-top: 2rem;
  animation: fadeInUp 1s ease-out;
}

.app-card {
  grid-column: span 2;
  margin: 0; /* Removing margins as we use grid gap */
}

/* Broken Grid: Feature cards span more space */
.app-card:nth-child(1) {
  grid-column: 1 / span 4;
}

.app-card:nth-child(4) {
  grid-column: 3 / span 4;
}

/* Middle row spans the full 6 columns together */
.app-card:nth-child(2),
.app-card:nth-child(3) {
  grid-column: span 3;
}

@media only screen and (max-width: 1024px) {
  .app-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .app-card {
    grid-column: span 1 !important;
  }
  .app-card:nth-child(1),
  .app-card:nth-child(4) {
    grid-column: span 2 !important;
  }
}

@media only screen and (max-width: 768px) {
  .app-grid {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .app-card {
    grid-column: span 1 !important;
    margin-bottom: 1rem;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.app-card:nth-child(1)) {
  --delay: 2;
}

:deep(.app-card:nth-child(2)) {
  --delay: 11;
}

:deep(.app-card:nth-child(3)) {
  --delay: 7;
}

:deep(.app-card:nth-child(4)) {
  --delay: 13;
}

:deep(.app-card:nth-child(5)) {
  --delay: 3;
}

:deep(.app-card:nth-child(6)) {
  --delay: 11;
}
</style>
