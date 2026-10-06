<template>
  <div class="layout-workspace">
    <slot />
  </div>
</template>

<style scoped>
.layout-workspace {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}
</style>
