<template>
  <div class="flex flex-col w-screen h-screen overflow-hidden">
    <!-- Header của workspace -->
    <header class="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
      <div class="flex items-center gap-4">
        <NuxtLink to="/" class="text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center">
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <span class="font-semibold text-sm text-slate-800">Untitled Document</span>
      </div>
      
      <div class="text-slate-400 text-sm">
        <span>Workspace Placeholder</span>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 flex flex-row overflow-hidden">
      <!-- Toolbar (Left) -->
      <Toolbar />

      <!-- Canvas Area (Center) -->
      <div class="flex-1 relative h-full overflow-hidden bg-slate-50">
        <GeoCanvas />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'workspace'
})
</script>

<style scoped>
/* Vite HMR cache fix */
</style>

