<script setup lang="ts">
import { computed, ref } from "vue"

const numerator = ref(3)
const denominator = ref(4)

const simplified = computed(() => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const common = gcd(numerator.value, denominator.value)
  return {
    num: numerator.value / common,
    den: denominator.value / common,
  }
})

const percentage = computed(() => {
  if (denominator.value === 0) return 0
  return (numerator.value / denominator.value) * 100
})

const pieStyle = computed(() => {
  const p = percentage.value
  return {
    background: `conic-gradient(var(--accent) 0% ${p}%, #e0e0e0 ${p}% 100%)`,
  }
})

const barStyle = computed(() => {
    return {
        width: `${Math.min(percentage.value, 100)}%`
    }
})

</script>

<template>
  <section class="fractions">
    <div class="fractions-header">
      <div>
        <p class="eyebrow">Math Tool</p>
        <h1>Fractions Studio</h1>
        <p class="subtle">Visual fraction models and equivalence checks.</p>
      </div>
    </div>

    <div class="fractions-grid">
      <section class="card control-panel">
        <h2>Builder</h2>
        <div class="field-row">
          <label>
            <span>Numerator</span>
            <input v-model.number="numerator" type="number" min="0" />
          </label>
          <label>
            <span>Denominator</span>
            <input v-model.number="denominator" type="number" min="1" />
          </label>
        </div>

        <div class="stats">
            <p><strong>Simplified:</strong> {{ simplified.num }} / {{ simplified.den }}</p>
            <p><strong>Decimal:</strong> {{ (numerator / denominator).toFixed(4) }}</p>
            <p><strong>Percentage:</strong> {{ percentage.toFixed(2) }}%</p>
        </div>
      </section>

      <section class="card visualization">
        <h2>Visualizer</h2>
        <div class="visuals">
            <div class="pie-container">
                <div class="pie-chart" :style="pieStyle"></div>
                <span class="caption">Pie Model</span>
            </div>
            <div class="bar-container">
                <div class="bar-track">
                    <div class="bar-fill" :style="barStyle"></div>
                </div>
                 <span class="caption">Bar Model</span>
            </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.fractions {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.fractions-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: flex-start;
}

.fractions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 16px 30px rgba(29, 31, 27, 0.06);
}

.card h2 {
  margin: 0;
  font-family: "Source Serif 4", serif;
}

.field-row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr 1fr;
}

label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
}

input {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: #fafbfa;
  font-size: 0.95rem;
  width: 100%;
}

.stats {
    background: #fafbfa;
    padding: 1rem;
    border-radius: 12px;
    font-size: 0.9rem;
    display: grid;
    gap: 0.5rem;
}

.visuals {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
    padding: 1rem 0;
}

.pie-container, .bar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
}

.pie-chart {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: 1px solid var(--border-soft);
    transition: background 0.3s ease;
}

.bar-track {
    width: 100%;
    height: 40px;
    background: #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--border-soft);
}

.bar-fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.3s ease;
}

.caption {
    font-size: 0.8rem;
    color: var(--ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
</style>
