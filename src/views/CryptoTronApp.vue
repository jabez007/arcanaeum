<script setup lang="ts">
//@ts-expect-error CryptoTron is a self contained app, the type doesn't matter
import CryptoTron from "cryptotron.vue";
import { useRouter, useRoute } from "vue-router";

const { app } = CryptoTron;

const router = useRouter();
const route = useRoute();
</script>

<template>
  <app style="min-height: 100vh; min-width: 100vw; z-index: 10" :app-router="router" :app-route="route" />
</template>

<style>
@import "cryptotron.vue/style.css";
</style>
