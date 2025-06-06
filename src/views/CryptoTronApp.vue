<script setup lang="ts">
//@ts-expect-error CryptoTron is a self contained app, the type doesn't matter
import CryptoTron from "@jabez007/cryptotron.vue";
import { defineAsyncComponent } from "vue";

const app = defineAsyncComponent(CryptoTron.app);
</script>

<template>
  <app style="min-height: 100vh; min-width: 100vw; z-index: 10" />
</template>

<style>
@import "@jabez007/cryptotron.vue/style.css";
</style>
