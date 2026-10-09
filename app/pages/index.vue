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
        <button @click="newWorkspace" class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-semibold text-white transition-all duration-300 bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-[0_0_40px_8px_rgba(37,99,235,0.3)] dark:hover:shadow-[0_0_40px_8px_rgba(59,130,246,0.3)] hover:-translate-y-1">
          {{ $t('landing.new_workspace') }}
          <Icon name="lucide:plus" class="w-5 h-5 transition-transform group-hover:rotate-90" />
        </button>
        
        <button @click="importJSON" class="inline-flex items-center justify-center gap-3 px-8 py-4 font-semibold text-slate-700 dark:text-slate-300 transition-all duration-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-1 hover:shadow-lg">
          <Icon name="lucide:upload" class="w-5 h-5" />
          {{ $t('landing.import_json') }}
        </button>
      </div>

      <!-- Quick Templates -->
      <div class="mt-12 w-full max-w-3xl animate-fade-in-up" style="animation-delay: 0.35s;">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">{{ $t('landing.quick_templates') }}</h3>
        <div class="flex justify-center gap-4">
          <button @click="openTemplate('triangle')" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 transition-all hover:-translate-y-1 w-32">
            <Icon name="lucide:triangle" class="w-8 h-8 text-blue-500" />
            <span class="text-sm font-medium">{{ $t('landing.template_triangle') }}</span>
          </button>
          <button @click="openTemplate('quadrilateral')" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-purple-300 transition-all hover:-translate-y-1 w-32">
            <Icon name="lucide:square" class="w-8 h-8 text-purple-500" />
            <span class="text-sm font-medium">{{ $t('landing.template_quadrilateral') }}</span>
          </button>
          <button @click="openTemplate('circle')" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-teal-300 transition-all hover:-translate-y-1 w-32">
            <Icon name="lucide:circle" class="w-8 h-8 text-teal-500" />
            <span class="text-sm font-medium">{{ $t('landing.template_circle') }}</span>
          </button>
        </div>
      </div>

      <!-- Recent Documents -->
      <div v-if="recentDocs.length > 0" class="mt-16 w-full max-w-4xl animate-fade-in-up text-left" style="animation-delay: 0.4s;">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-6 pl-4">{{ $t('landing.recent_documents') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <button 
            v-for="doc in recentDocs" 
            :key="doc.metadata.id" 
            @click="openDocument(doc)"
            class="group text-left p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:-translate-y-1"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Icon name="lucide:file-box" class="w-5 h-5" />
              </div>
              <div class="truncate font-semibold text-slate-800 dark:text-slate-200">
                {{ doc.metadata.title || $t('workspace.untitled') }}
              </div>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-1 truncate">{{ doc.metadata.description || $t('document.no_desc') }}</p>
            <p class="text-[10px] text-slate-400">{{ new Date(doc.metadata.updatedAt).toLocaleString() }}</p>
          </button>
        </div>
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
import { ref, onMounted } from 'vue';
import { useTheme } from '../composables/useTheme';
import { useI18n, useRouter } from '#imports';
import { DocumentStorage } from '../../core/storage/DocumentStorage';
import type { GeoDocument } from '../../core/types/document';
import { useGeometryStore } from '../stores/geometry';
import { Point, Polygon, Circle } from '../../core/geometry/primitives/2d';

const { toggleTheme, isDark } = useTheme();
const { locale, setLocale, t } = useI18n();
const router = useRouter();
const store = useGeometryStore();
const recentDocs = ref<GeoDocument[]>([]);

onMounted(async () => {
  const storage = new DocumentStorage();
  recentDocs.value = (await storage.list()).slice(0, 3);
});

const toggleLanguage = () => {
  setLocale(locale.value === 'vi' ? 'en' : 'vi');
};

const newWorkspace = () => {
  store.loadDocument({
    version: '1.0',
    schemaVersion: 1,
    metadata: {
      id: crypto.randomUUID(),
      title: t('workspace.untitled'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    settings: { theme: 'light', gridVisible: true, axisVisible: true, snapEnabled: true, dimension: 2 },
    viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
    objects: []
  });
  router.push('/workspace');
};

const importJSON = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const text = await file.text();
      try {
        const doc = JSON.parse(text);
        if (doc.metadata && doc.objects) {
          store.loadDocument(doc);
          router.push('/workspace');
        } else {
          alert('Invalid GeoStudio Document Format');
        }
      } catch (err) {
        console.error('Invalid JSON', err);
        alert('Invalid JSON File');
      }
    }
  };
  input.click();
};

const openDocument = (doc: GeoDocument) => {
  store.loadDocument(doc);
  router.push('/workspace');
};

const openTemplate = (type: string) => {
  const objects: any[] = [];
  if (type === 'triangle') {
    const p1 = new Point(-2, -2).toJSON(); if(p1.metadata) p1.metadata.label = 'A';
    const p2 = new Point(2, -2).toJSON(); if(p2.metadata) p2.metadata.label = 'B';
    const p3 = new Point(0, 2).toJSON(); if(p3.metadata) p3.metadata.label = 'C';
    const poly = new Polygon([{x: -2, y: -2}, {x: 2, y: -2}, {x: 0, y: 2}]).toJSON();
    poly.parents = [p1.id, p2.id, p3.id];
    objects.push(p1, p2, p3, poly);
  } else if (type === 'quadrilateral') {
    const p1 = new Point(-2, -2).toJSON(); if(p1.metadata) p1.metadata.label = 'A';
    const p2 = new Point(2, -2).toJSON(); if(p2.metadata) p2.metadata.label = 'B';
    const p3 = new Point(2, 2).toJSON(); if(p3.metadata) p3.metadata.label = 'C';
    const p4 = new Point(-2, 2).toJSON(); if(p4.metadata) p4.metadata.label = 'D';
    const poly = new Polygon([{x: -2, y: -2}, {x: 2, y: -2}, {x: 2, y: 2}, {x: -2, y: 2}]).toJSON();
    poly.parents = [p1.id, p2.id, p3.id, p4.id];
    objects.push(p1, p2, p3, p4, poly);
  } else if (type === 'circle') {
    const p1 = new Point(0, 0).toJSON(); if(p1.metadata) p1.metadata.label = 'O';
    const circ = new Circle({x: 0, y: 0}, 3).toJSON();
    circ.parents = [p1.id];
    objects.push(p1, circ);
  }
  
  store.loadDocument({
    version: '1.0',
    schemaVersion: 1,
    settings: { theme: 'light', gridVisible: true, axisVisible: true, snapEnabled: true, dimension: 2 },
    viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
    metadata: {
      id: crypto.randomUUID(),
      title: t('landing.template_' + type),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    objects
  });
  router.push('/workspace');
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
