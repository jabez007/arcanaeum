<template>
  <div class="app-card" role="button" @click="navigateTo" @keyup.enter="navigateTo">
    <div class="app-icon">{{ props.icon }}</div>
    <h3 class="app-title">{{ props.title }}</h3>
    <p class="app-description">{{ props.description }}</p>
  </div>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import { useRouter } from "vue-router";

const props = defineProps<{
  icon: string;
  title: string;
  description: string;
  to: RouteLocationRaw;
}>();

const router = useRouter();

const navigateTo = () => {
  if (props.to) {
    if (typeof props.to === "string" && props.to.startsWith("http")) {
      window.open(props.to, "_blank", "noopener,noreferrer")?.focus();
    } else {
      router.push(props.to);
    }
  }
};
</script>

<style scoped>
.app-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(100, 255, 218, 0.2);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation:
    /* fadeInUp 1s ease-out, */
    mysticalFloat 13s ease-in-out infinite;
  animation-delay: calc(var(--delay) * 0.2s), calc(var(--delay) * 1s);
}

.app-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(100, 255, 218, 0.1), transparent);
  transition: left 0.5s;
}

.app-card:hover::before {
  left: 100%;
}

.app-card:hover {
  transform: translateY(-15px) scale(1.05) !important;
  border-color: rgba(100, 255, 218, 0.5);
  box-shadow:
    0 25px 50px rgba(100, 255, 218, 0.15),
    0 0 40px rgba(100, 255, 218, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation-play-state: paused;
}

.app-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #64ffda, #bb86fc);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  transition: all 0.3s ease;
  position: relative;
}

.app-icon::after {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #64ffda, #bb86fc, #03dac6, #64ffda);
  border-radius: 50%;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.app-card:hover .app-icon::after {
  opacity: 1;
  animation: rotate 2s linear infinite;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #fff;
}

.app-description {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  font-size: 0.95rem;
}

@keyframes mysticalFloat {
  0% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
  }

  12.5% {
    transform: translateY(-15px) translateX(8px) rotate(1deg);
  }

  25% {
    transform: translateY(-8px) translateX(-12px) rotate(-0.8deg);
  }

  37.5% {
    transform: translateY(-22px) translateX(5px) rotate(1.2deg);
  }

  50% {
    transform: translateY(-12px) translateX(-8px) rotate(-0.5deg);
  }

  62.5% {
    transform: translateY(-18px) translateX(10px) rotate(0.9deg);
  }

  75% {
    transform: translateY(-6px) translateX(-15px) rotate(-1.1deg);
  }

  87.5% {
    transform: translateY(-25px) translateX(3px) rotate(0.7deg);
  }

  100% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
