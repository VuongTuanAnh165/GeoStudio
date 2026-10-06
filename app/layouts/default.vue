<template>
  <div class="layout-default">
    <header class="header">
      <div class="logo">
        <Icon name="lucide:compass" class="logo-icon" />
        <h1>GeoStudio</h1>
      </div>
      <nav class="nav">
        <!-- Optional navigation -->
      </nav>
    </header>
    
    <main class="main-content">
      <slot />
    </main>

    <footer class="footer">
      <p>&copy; 2026 GeoStudio Project</p>
    </footer>
  </div>
</template>

<style scoped>
.layout-default {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
}

.logo-icon {
  font-size: 1.5rem;
}

.logo h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.footer {
  padding: 1.5rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  background-color: var(--header-bg);
  border-top: 1px solid var(--border-color);
}
</style>
