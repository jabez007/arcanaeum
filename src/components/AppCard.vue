<template>
  <div class="app-card shard-shape" 
       :class="`shard-${props.index % 3}`"
       role="button" 
       tabindex="0" 
       @click="navigateTo" 
       @keyup.enter="navigateTo">
    <div class="shard-glow"></div>
    <div class="mystical-glyph glyph-top-right"></div>
    <div class="mystical-glyph glyph-bottom-left"></div>
    
    <div class="content-wrapper">
      <div class="app-icon">{{ props.icon }}</div>
      <h3 class="app-title">{{ props.title }}</h3>
      <p class="app-description">{{ props.description }}</p>
    </div>
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
  index: number;
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
  background: rgba(100, 255, 218, 0.05);
  backdrop-filter: blur(12px);
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative;
  overflow: hidden;
  border: none;
  animation: mysticalFloat 15s ease-in-out infinite;
  animation-delay: calc(var(--delay) * 1s);
}

.content-wrapper {
  position: relative;
  z-index: 2;
}

/* Shard Shapes */
.shard-0 { clip-path: polygon(5% 0%, 100% 10%, 90% 95%, 0% 100%); }
.shard-1 { clip-path: polygon(0% 10%, 95% 0%, 100% 90%, 10% 100%); }
.shard-2 { clip-path: polygon(10% 0%, 100% 5%, 95% 100%, 0% 90%); }

.shard-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(100, 255, 218, 0.1), rgba(187, 134, 252, 0.1));
  opacity: 0.5;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.app-card:hover .shard-glow {
  opacity: 1;
  background: linear-gradient(135deg, rgba(100, 255, 218, 0.2), rgba(187, 134, 252, 0.2));
}

/* Mystical Glyphs */
.mystical-glyph {
  position: absolute;
  width: 50px;
  height: 50px;
  border: 1px solid rgba(100, 255, 218, 0.1);
  opacity: 0;
  transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: none;
  z-index: 3;
}

.glyph-top-right {
  top: -10px;
  right: -10px;
  border-radius: 5px;
  transform: rotate(45deg);
}

.glyph-bottom-left {
  bottom: -10px;
  left: -10px;
  border-radius: 5px;
  transform: rotate(-30deg);
}

.app-card:hover .mystical-glyph {
  opacity: 0.4;
  border-color: rgba(100, 255, 218, 0.6);
}

.app-card:hover .glyph-top-right {
  top: 15px;
  right: 15px;
  transform: rotate(135deg);
}

.app-card:hover .glyph-bottom-left {
  bottom: 15px;
  left: 15px;
  transform: rotate(-120deg);
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
  z-index: 1;
}

.app-card:hover::before {
  left: 100%;
}

.app-card:hover {
  transform: translateY(-20px) scale(1.03) rotate(1deg) !important;
  box-shadow: 0 30px 60px rgba(100, 255, 218, 0.2);
  animation-play-state: paused;
}

/* Magical Surge Effect on Click */
.app-card:active {
  transform: translateY(-5px) scale(0.97) !important;
  box-shadow: 0 0 80px rgba(100, 255, 218, 0.5);
  transition: all 0.1s ease;
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
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(10px, -15px) rotate(1deg); }
  66% { transform: translate(-10px, -10px) rotate(-1deg); }
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
