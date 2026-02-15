<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useAuthStore } from "@/stores/auth"

const auth = useAuthStore()

const tools = computed(() => [
  {
    name: "Multiplication Printouts",
    description: "Generate printable multiplication grids and worksheets for classes.",
    status: "Ready",
    route: "/tools/multiplication-printouts",
    cta: "Open",
  },
  {
    name: "GCD / HCF Explorer",
    description: "Calculate greatest common divisors and create practice worksheets.",
    status: "Ready",
    route: "/tools/gcd-hcf",
    cta: "Open",
  },
  {
    name: "LCM Explorer",
    description: "Compute least common multiples and create LCM practice worksheets.",
    status: "Ready",
    route: "/tools/lcm",
    cta: "Open",
  },
  {
    name: "Number Sense Lab",
    description: "Place value, rounding, and number patterns for primary and junior levels.",
    status: "Ready",
    route: "/tools/number-sense",
    cta: "Open",
  },
  {
    name: "Fractions Studio",
    description: "Visual fraction models, equivalence checks, and practice sets.",
    status: "Ready",
    route: "/tools/fractions",
    cta: "Open",
  },
  {
    name: "Geometry Board",
    description: "Angle explorer, perimeter & area calculators, and shape builder.",
    status: "Planned",
  },
  {
    name: "Algebra Workbench",
    description: "Equation solver, factorization drills, and graphing basics.",
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
        <p class="eyebrow">Shuleyangu Math</p>
        <h1>Math tools for {{ auth.schoolName || "your school" }}</h1>
        <p class="subtle">
          Build focused practice, visual explanations, and instant checks in one place.
        </p>
      </div>
      <div class="hero-actions">
        <RouterLink class="primary" to="/tools/multiplication-printouts">Open Printouts</RouterLink>
        <RouterLink class="secondary" to="/">View Tool Roadmap</RouterLink>
      </div>
    </div>

    <div class="stat-grid fade-in">
      <div class="stat-card">
        <span class="stat-label">Active tools</span>
        <span class="stat-value">5</span>
        <span class="subtle">Multiplication, HCF, LCM, Number Sense, Fractions</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Upcoming</span>
        <span class="stat-value">2</span>
        <span class="subtle">Geometry, Algebra</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Format</span>
        <span class="stat-value">PDF</span>
        <span class="subtle">Professional print-ready output</span>
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
