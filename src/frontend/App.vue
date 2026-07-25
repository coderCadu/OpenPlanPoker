<template>
  <div id="app" class="app">
    <header class="app-header">
      <h1>Planning Poker</h1>
    </header>
    <main class="app-main">
      <p>Welcome to Planning Poker</p>
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #333;
  color: white;
  padding: 1rem;
  text-align: center;
}

.app-header h1 {
  margin: 0;
  font-size: 2rem;
}

.app-main {
  flex: 1;
  padding: 2rem;
}
</style>
