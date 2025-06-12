<template>
  <div id="particles" class="particles"></div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createParticles() {
  const particlesContainer = document.getElementById("particles");
  const particleCount = getRandomInt(50, 100);

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    const size = Math.random();

    if (size < 0.6) {
      particle.className = "particle small";
    } else if (size < 0.85) {
      particle.className = "particle medium";
    } else {
      particle.className = "particle large";
    }

    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 8 + "s";
    particle.style.animationDuration = Math.random() * 4 + 6 + "s";
    particle.style.setProperty("--drift", (Math.random() - 0.5) * 100 + "px");
    //@ts-expect-error particles container wont be null
    particlesContainer.appendChild(particle);
  }
}

onMounted(() => {
  createParticles();
});
</script>

<style scoped>
.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
}

:deep(.particle) {
  position: absolute;
  border-radius: 50%;
  animation: floatParticle 8s infinite linear;
}

:deep(.particle.small) {
  width: 1px;
  height: 1px;
  background: #64ffda;
  box-shadow: 0 0 6px #64ffda;
}

:deep(.particle.medium) {
  width: 3px;
  height: 3px;
  background: #bb86fc;
  box-shadow: 0 0 10px #bb86fc;
}

:deep(.particle.large) {
  width: 5px;
  height: 5px;
  background: #03dac6;
  box-shadow: 0 0 15px #03dac6;
}

@keyframes floatParticle {
  0% {
    transform: translateY(100vh) translateX(0px) scale(0);
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  90% {
    opacity: 1;
  }

  100% {
    transform: translateY(-100px) translateX(var(--drift)) scale(1);
    opacity: 0;
  }
}
</style>
