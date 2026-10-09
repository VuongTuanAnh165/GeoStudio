<template>
  <div 
    class="katex-display-wrapper text-slate-800 dark:text-slate-200" 
    v-html="renderedFormula"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const props = defineProps<{
  formula: string;
  displayMode?: boolean;
}>();

const renderedFormula = computed(() => {
  try {
    return katex.renderToString(props.formula, {
      displayMode: props.displayMode === true,
      throwOnError: false,
    });
  } catch (e) {
    console.error('KaTeX rendering error:', e);
    return props.formula;
  }
});
</script>

<style scoped>
.katex-display-wrapper {
  display: inline-block;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
}
</style>
