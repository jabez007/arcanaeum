<script setup lang="ts">
//@ts-expect-error CryptoTron is a self contained app, the type doesn't matter
import CryptoTron from "@jabez007/cryptotron.vue";
import { defineAsyncComponent } from "vue";

const CryptoTronAsync = defineAsyncComponent(CryptoTron.app);
</script>

<template>
  <CryptoTronAsync
    style="min-height: 100vh; max-height: 100vh; min-width: 100vw; z-index: 10; contain: paint"
  />
</template>

<style>
@import "@jabez007/cryptotron.vue/style.css";

@import "@vue-flow/core/dist/style.css";
@import "@vue-flow/core/dist/theme-default.css";
@import "@vue-flow/controls/dist/style.css";
</style>
