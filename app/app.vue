<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Global CSS */
:root {
  --primary-color: #0066cc;
  --bg-color: #f8fafc;
  --text-color: #1e293b;
  --text-muted: #64748b;
  --header-bg: #ffffff;
  --border-color: #e2e8f0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
}
</style>
