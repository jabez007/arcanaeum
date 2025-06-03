<script setup lang="ts">
import { RouterLink } from "vue-router";
import ParticlesDiv from "@/components/ParticlesDiv.vue";
</script>

<template>
  <ParticlesDiv />
  <div class="floating-orbs">
    <div class="orb"></div>
    <div class="orb"></div>
    <div class="orb"></div>
    <div class="orb"></div>
    <div class="orb"></div>
  </div>
  <div class="container">
    <header>
      <h1 class="title">Archon's Arcanaeum</h1>
      <p class="subtitle">Choose your digital realm</p>
    </header>
  </div>
</template>

<style scoped>
@import "@/assets/orbs.css";

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  font-weight: normal;
}

header {
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  place-items: center;
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

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}
</style>
