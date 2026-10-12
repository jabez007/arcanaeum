<script setup lang="ts">
const particles = Array.from({ length: 24 }, () => {
  const duration = 32 + Math.random() * 20;
  return {
    size: Math.random() < 0.75 ? "small" : "medium",
    style: {
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${-Math.random() * duration}s`,
      animationDuration: `${duration}s`,
      "--drift": `${(Math.random() - 0.5) * 30}px`,
    },
  };
});
</script>

<template>
  <div class="particles" aria-hidden="true">
    <div
      v-for="(particle, index) in particles"
      :key="index"
      class="particle"
      :class="particle.size"
      :style="particle.style"
    ></div>
  </div>
</template>

<style scoped>
.particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.25;
  animation: floatParticle 40s infinite linear;
}

.particle.small {
  width: 1px;
  height: 1px;
  background: #64ffda;
  box-shadow: 0 0 4px #64ffda;
}

.particle.medium {
  width: 2px;
  height: 2px;
  background: #bb86fc;
  box-shadow: 0 0 6px #bb86fc;
}

@keyframes floatParticle {
  0% {
    transform: translateY(15vh) translateX(0);
    opacity: 0;
  }
  20%,
  80% {
    opacity: 0.35;
  }
  100% {
    transform: translateY(-15vh) translateX(var(--drift));
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .particle {
    animation: none;
    opacity: 0.25;
  }
}
</style>
