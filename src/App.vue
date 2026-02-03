<script setup lang="ts">
import { onMounted } from "vue"
import { RouterView } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import AppNav from "@/components/AppNav.vue"

const auth = useAuthStore()

onMounted(() => {
  void auth.bootstrap()
})
</script>

<template>
  <div class="app-shell">
    <AppNav class="no-print" />

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer no-print">
      <span>ShuleYangu Math</span>
      <span class="footer-divider">•</span>
      <span>Powered by ShuleYangu Systems</span>
    </footer>
  </div>
</template>
