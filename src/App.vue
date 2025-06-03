<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <transition name="scale-transition" mode="out-in">
      <div id="arcanaeum" :key="(route.name as string).split('-')[0]">
        <component :is="Component" />
      </div>
    </transition>
  </RouterView>
</template>

<style scoped lang="scss">
#arcanaeum {
  min-height: 100vh;
  min-width: 100vw;
  display: flex;
  place-items: center;
}

$transition-duration-root: 0.3s !default;
$transition-move-duration-root: 0.5s !default;
$standard-easing: cubic-bezier(0.4, 0, 0.2, 1) !default;

@mixin transition-default() {
  &-enter-active {
    transition-duration: $transition-duration-root !important;
    transition-timing-function: $standard-easing !important;
  }

  &-leave-active {
    transition-duration: $transition-duration-root !important;
    transition-timing-function: $standard-easing !important;
  }

  &-move {
    transition-duration: $transition-move-duration-root !important;
    transition-property: transform !important;
    transition-timing-function: $standard-easing !important;
  }
}

@mixin fade-out() {
  &-leave-to {
    opacity: 0;
  }

  &-leave-active {
    transition-duration: 100ms !important;
  }
}

.scale-transition {
  @include transition-default();
  @include fade-out();

  &-enter-from {
    opacity: 0;
    transform: scale(0);
  }

  &-enter-active,
  &-leave-active {
    transition-property: transform, opacity !important;
  }
}
</style>
