<script setup lang="ts">
//@ts-expect-error CryptoTron is a self contained app, the type doesn't matter
import CryptoTron from "cryptotron.vue";
</script>

<template>
  <CryptoTron style="min-height: 100vh; min-width: 100vw; z-index: 10" />
</template>

<style>
@import "cryptotron.vue/style.css";
</style>
