<template>
  <div class="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-500 font-sans">
    
    <!-- Background Decorators -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
      <div class="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[120px]" />
      <div class="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[120px]" />
      <div class="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-teal-400/10 dark:bg-teal-600/10 blur-[120px]" />
      
      <!-- Grid Pattern Overlay -->
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4xNSkiLz48L3N2Zz4=')] opacity-50 dark:opacity-20" />
    </div>

    <!-- Header / Navbar -->
    <header class="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
      <div class="flex items-center gap-3 group cursor-pointer">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
          <Icon name="lucide:compass" class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
          GeoStudio
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <!-- Language Toggle -->
        <button 
          @click="toggleLanguage" 
          class="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-md font-medium text-sm uppercase"
          :title="$t('statusbar.change_language')"
        >
          {{ locale }}
        </button>

        <!-- Theme Toggle -->
        <button 
          @click="toggleTheme" 
          class="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-md"
          :title="isDark ? $t('statusbar.light_mode') : $t('statusbar.dark_mode')"
        >
          <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- Main Hero Section -->
    <main class="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
      
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 animate-fade-in-up">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
        </span>
        {{ $t('landing.new_version') }}
      </div>

      <h2 class="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-tight mb-8 animate-fade-in-up" style="animation-delay: 0.1s;">
        Bộ công cụ hình học tương tác <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">chuyên nghiệp</span>
      </h2>
      
      <p class="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed animate-fade-in-up" style="animation-delay: 0.2s;">
        {{ $t('landing.desc') }}
      </p>
      
      <div class="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up" style="animation-delay: 0.3s;">
        <NuxtLink to="/workspace" class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-semibold text-white transition-all duration-300 bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-[0_0_40px_8px_rgba(37,99,235,0.3)] dark:hover:shadow-[0_0_40px_8px_rgba(59,130,246,0.3)] hover:-translate-y-1">
          {{ $t('landing.start') }}
          <Icon name="lucide:arrow-right" class="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </NuxtLink>
        
        <a href="https://github.com" target="_blank" class="inline-flex items-center justify-center gap-3 px-8 py-4 font-semibold text-slate-700 dark:text-slate-300 transition-all duration-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-1 hover:shadow-lg">
          <Icon name="lucide:github" class="w-5 h-5" />
          {{ $t('landing.opensource') }}
        </a>
      </div>
      
      <!-- Feature Cards -->
      <div class="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 animate-fade-in-up" style="animation-delay: 0.5s;">
        <!-- Card 1 -->
        <div class="group relative p-8 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2 text-left overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div class="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
            <Icon name="lucide:pen-tool" class="w-7 h-7" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-3">{{ $t('landing.feature1_title') }}</h3>
          <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
            {{ $t('landing.feature1_desc') }}
          </p>
        </div>
        
        <!-- Card 2 -->
        <div class="group relative p-8 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-2 text-left overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div class="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
            <Icon name="lucide:move-3d" class="w-7 h-7" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-3">{{ $t('landing.feature2_title') }}</h3>
          <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
            {{ $t('landing.feature2_desc') }}
          </p>
        </div>
        
        <!-- Card 3 -->
        <div class="group relative p-8 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-2 text-left overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div class="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
            <Icon name="lucide:hand" class="w-7 h-7" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-3">{{ $t('landing.feature3_title') }}</h3>
          <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
            {{ $t('landing.feature3_desc') }}
          </p>
        </div>
      </div>
      
    </main>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../composables/useTheme';
import { useI18n } from '#imports';

const { toggleTheme, isDark } = useTheme();
const { locale, setLocale } = useI18n();

const toggleLanguage = () => {
  setLocale(locale.value === 'vi' ? 'en' : 'vi');
};

definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
