<script setup lang="ts">
import AppCard from "@/components/AppCard.vue";
import ArcaneIcon from "@/components/icons/ArcaneIcon.vue";
import PromptInjectionCanary from "@/components/PromptInjectionCanary.vue";
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
  <PromptInjectionCanary />
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
        <path
          d="M200,200 L600,150 L1000,250 L800,600 L400,550 Z"
          stroke="url(#lineGrad)"
          stroke-width="1.5"
          fill="none"
          stroke-dasharray="1000"
          :stroke-dashoffset="prefersReducedMotion ? 0 : 1000"
        >
          <animate
            v-if="!prefersReducedMotion"
            attributeName="stroke-dashoffset"
            from="1000"
            to="0"
            dur="5s"
            fill="freeze"
          />
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
      <p class="subtitle">Stabilizing the Spire's Most Volatile Arcana</p>
      <p class="introduction">
        I'm <strong>jabez007</strong>, a backend architect building developer tools and documenting
        homelab experiments. This is where I keep my projects and field notes.
      </p>
      <nav class="intro-links" aria-label="About and profiles">
        <router-link :to="{ name: 'about' }">About the Vice Magus</router-link>
        <a href="https://github.com/jabez007" target="_blank" rel="noopener noreferrer">
          GitHub <span aria-hidden="true">↗</span
          ><span class="sr-only"> (opens in a new tab)</span>
        </a>
      </nav>
    </header>
    <section class="projects" aria-labelledby="projects-title">
      <h2 id="projects-title">Tools, experiments &amp; field notes</h2>
      <div class="app-grid">
        <AppCard
          title="CryptoTron"
          :index="0"
          category="Cipher lab"
          action="Open the lab"
          description="Encode, decode, and experiment with classic ciphers and hidden messages."
          :to="{ name: 'cryptotron-home' }"
        >
          <template #icon><ArcaneIcon name="cipher" /></template>
        </AppCard>
        <AppCard
          title="Heur Aegis DEX"
          :index="1"
          category="Team workbench"
          action="Explore the DEX"
          description="Compare Pokémon, explore type matchups, and plan your next team."
          :to="{ name: 'heur-aegis-dex' }"
        >
          <template #icon><ArcaneIcon name="aegis" /></template>
        </AppCard>
        <AppCard
          title="The Forgotten Pepper"
          :index="2"
          category="Kitchen experiments"
          action="Visit the blog"
          description="A culinary blog for the other kind of experimentation."
          to="https://theforgottenpepper.com"
        >
          <template #icon><ArcaneIcon name="pepper" /></template>
        </AppCard>
        <AppCard
          title="Commits & Conjurations"
          :index="3"
          category="Field notes"
          action="Read the notes"
          description="Homelab adventures, Linux fixes, and scripts worth keeping."
          :to="{ name: 'BlogList' }"
        >
          <template #icon><ArcaneIcon name="tome" /></template>
        </AppCard>
        <AppCard
          title="Meet the Vice Magus"
          :index="4"
          category="The conjurer"
          action="Meet jabez007"
          description="Who's behind the glyphs? Meet jabez007, the Vice Magus."
          :to="{ name: 'about' }"
        >
          <template #icon><ArcaneIcon name="magus" /></template>
        </AppCard>
      </div>
    </section>
    <PromptInjectionCanary />
  </div>
</template>

<style scoped>
@import "@/assets/orbs.css";

.constellation-container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

@media only screen and (max-width: 900px) {
  .constellation-container {
    padding: 1.5rem 1rem;
  }
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
  margin-bottom: 2.5rem;
}

.title {
  font-family: var(--arcanaeum-font-display);
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 300;
  background: linear-gradient(45deg, #64ffda, #bb86fc, #03dac6);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(100, 255, 218, 0.3);
  margin-bottom: 1rem;
}

.subtitle {
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: #bb86fc;
  opacity: 0.9;
  font-weight: 400;
}

.introduction {
  max-width: 62ch;
  margin: 1.5rem auto 0;
  color: #d4d7e7;
  font-size: 1rem;
  line-height: 1.8;
}

.introduction strong {
  color: #64ffda;
  font-weight: 600;
}

.intro-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem 1.5rem;
  margin-top: 1rem;
}

.intro-links a {
  color: #64ffda;
  padding: 0.5rem;
  border-radius: 4px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.projects {
  position: relative;
  z-index: 2;
  width: 100%;
}

.projects h2 {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--arcanaeum-muted);
  margin-bottom: 1rem;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1.25rem;
}

.app-card {
  grid-column: span 2;
}

.app-card:nth-child(1),
.app-card:nth-child(2) {
  grid-column: span 3;
}

@media (min-width: 701px) and (max-width: 1100px) {
  .app-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .app-card,
  .app-card:nth-child(1),
  .app-card:nth-child(2) {
    grid-column: span 1;
  }

  .app-card:last-child {
    grid-column: span 2;
  }
}

@media (max-width: 700px) {
  .app-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }

  .app-card,
  .app-card:nth-child(1),
  .app-card:nth-child(2) {
    grid-column: span 1;
  }
}
</style>
