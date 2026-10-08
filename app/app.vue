<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from './composables/useTheme';
import { registerBuiltinConstructions } from '../core/geometry/constructions/builtins';

const { initTheme } = useTheme();

onMounted(() => {
  initTheme();
  registerBuiltinConstructions();
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Global CSS is managed by Tailwind */
html, body, #__nuxt {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

* {
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
</style>
