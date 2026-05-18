<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  name: "cipher" | "pepper" | "tome" | "magus" | "aegis" | "home";
  size?: number | string;
}>();

const iconSize = computed(() => props.size || 40);

const icons = {
  cipher: {
    // A CPU/Microchip frame with a terminal prompt center
    viewBox: "0 0 24 24",
    path: `M5 5h14v14H5z 
           M9 2v3 M15 2v3 M9 19v3 M15 19v3 
           M2 9h3 M2 15h3 M19 9h3 M19 15h3 
           M9 10l2 2-2 2 
           M12 14h3`,
  },
  pepper: {
    // A sharp, shard-like chili pepper
    viewBox: "0 0 24 24",
    path: `M18 2l-4 4
           M14 6c-1-1-5-1-8 2s-3 7 0 10 7 3 10 0 3-7 0-10c-1-1-2-2-2-2z
           M7 11l3 3`,
  },
  tome: {
    // A book with sharp edges and a rune
    viewBox: "0 0 24 24",
    path: `M4 4h16v16H4z
           M4 6h16
           M4 18h16
           M12 10v4
           M10 12h4`, // A cross rune
  },
  magus: {
    // A hooded figure / triangle with glowing eye and tech-offset lines
    viewBox: "0 0 24 24",
    path: `M12 3l-8 18h16L12 3z
           M12 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z
           M2 19h2 M20 19h2 M12 21v2`,
  },
  aegis: {
    // A shield with a centered diamond (Arcane Gem)
    viewBox: "0 0 24 24",
    path: `M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z
           M12 8l4 4-4 4-4-4z`,
  },
  home: {
    // A simple house with arcane sharp edges
    viewBox: "0 0 24 24",
    path: `M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z
           M9 22V12h6v10`,
  },
};

const currentIcon = computed(() => icons[props.name]);
</script>

<template>
  <svg
    v-if="currentIcon"
    :width="iconSize"
    :height="iconSize"
    :viewBox="currentIcon.viewBox"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="arcane-icon"
  >
    <path :d="currentIcon.path" />
  </svg>
</template>

<style scoped>
.arcane-icon {
  transition: all 0.3s ease;
  color: #64ffda;
}
</style>
