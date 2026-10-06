<template>
  <div class="workspace">
    <!-- Header của workspace -->
    <header class="workspace-header">
      <div class="brand">
        <NuxtLink to="/" class="back-btn">
          <Icon name="lucide:arrow-left" />
        </NuxtLink>
        <span class="doc-title">Untitled Document</span>
      </div>
      
      <div class="tools-placeholder">
        <span>Workspace Placeholder</span>
      </div>
    </header>

    <!-- Canvas Area -->
    <div class="canvas-container">
      <div class="canvas-placeholder">
        <Icon name="lucide:layout-template" class="placeholder-icon" />
        <p>Canvas Area (Phase 3)</p>
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
.workspace {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.workspace-header {
  height: 50px;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 1rem;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--primary-color);
}

.doc-title {
  font-weight: 600;
  font-size: 0.875rem;
}

.tools-placeholder {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.canvas-container {
  flex-grow: 1;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* Background dot grid pattern placeholder */
.canvas-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.5;
  pointer-events: none;
}

.canvas-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #94a3b8;
  z-index: 10;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.canvas-placeholder p {
  font-size: 1.25rem;
  font-weight: 500;
}
</style>
