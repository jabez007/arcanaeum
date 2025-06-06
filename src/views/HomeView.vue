<script setup lang="ts">
import AppCard from "@/components/AppCard.vue";
</script>

<template>
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
    <div class="app-grid">
      <AppCard icon="🔏" title="CryptoTron" description="A classical cryptography lab for decrypting
        ancient secrets using modern tech. Interactive ciphers in a cyberpunk-themed digital laboratory."
        :to="{ name: 'cryptotron-home' }" />
      <AppCard icon="🫑" title="The Forgotten Pepper"
        description="A tasty little blog cooked up with VuePress and Tailwind—where simple ingredients meet bold design. From everyday meals to unexpected flavor twists, it's a clean, fast, and flavorful experience."
        to="https://theforgottenpepper.com" />
      <AppCard icon="🧙‍♂️ " title="Meet the Vice Magus" description="Who's behind the glyphs and code? Learn more about the backend conjurer with
        his scroll of sarcasm and compiler of chaos." :to="{ name: 'about' }" />
    </div>
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
  text-align: center;
  margin-bottom: 3rem;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  place-items: center;
  animation: fadeInDown 1s ease-out;
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
  animation: fadeInUp 1s ease-out;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.app-card {
  margin: 1rem;
  flex: 1 0 31%;
}

@media only screen and (max-width: 768px) {
  .app-grid {
    padding: 0;
  }

  .app-card {
    min-width: 100%;
    margin: 1rem auto;
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
  --delay: 5;
}

:deep(.app-card:nth-child(3)) {
  --delay: 7;
}

:deep(.app-card:nth-child(4)) {
  --delay: 3;
}

:deep(.app-card:nth-child(5)) {
  --delay: 11;
}

:deep(.app-card:nth-child(6)) {
  --delay: 13;
}
</style>
