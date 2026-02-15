<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useAuthStore } from "@/stores/auth"

const auth = useAuthStore()

const tools = computed(() => [
  {
    name: "Pendulum Lab",
    description: "Explore the relationship between length, gravity, and period with a virtual pendulum.",
    status: "Ready",
    route: "/science/pendulum",
    cta: "Launch Lab",
  },
  {
    name: "Projectile Motion",
    description: "Simulate projectile trajectories under different angles and velocities.",
    status: "Planned",
  },
  {
    name: "Circuit Builder",
    description: "Build and test simple DC circuits with resistors and batteries.",
    status: "Planned",
  },
])

function statusClass(status: string) {
  if (status === "Ready") return "pill ready"
  if (status === "Planned") return "pill planned"
  return "pill"
}
</script>

<template>
  <section class="dashboard">
    <div class="dashboard-hero fade-in">
      <div>
        <p class="eyebrow">Shuleyangu Science</p>
        <h1>Virtual Labs for {{ auth.schoolName || "your school" }}</h1>
        <p class="subtle">
          Interactive simulations to visualize physics and scientific concepts.
        </p>
      </div>
      <div class="hero-actions">
        <RouterLink class="primary" to="/science/pendulum">Open Pendulum Lab</RouterLink>
      </div>
    </div>

    <div class="stat-grid fade-in">
      <div class="stat-card">
        <span class="stat-label">Active Labs</span>
        <span class="stat-value">1</span>
        <span class="subtle">Pendulum</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Upcoming</span>
        <span class="stat-value">2</span>
        <span class="subtle">Projectile Motion, Circuits</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Type</span>
        <span class="stat-value">Virtual</span>
        <span class="subtle">Interactive Simulations</span>
      </div>
    </div>

    <div class="tool-grid fade-in">
      <article class="tool-card" v-for="tool in tools" :key="tool.name">
        <div>
          <h3>{{ tool.name }}</h3>
          <p>{{ tool.description }}</p>
        </div>
        <div class="tool-actions">
          <span :class="statusClass(tool.status)">{{ tool.status }}</span>
          <RouterLink v-if="tool.route" class="tool-action" :to="tool.route">{{ tool.cta }}</RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>
