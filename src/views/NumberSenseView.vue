<script setup lang="ts">
import { computed, reactive, ref } from "vue"

const inputNumber = ref<number | null>(123.45)

const placeValues = computed(() => {
  if (inputNumber.value === null) return []
  const n = inputNumber.value
  const s = n.toString()
  const parts = s.split(".")
  const integerPart = parts[0] || "0"
  const fractionalPart = parts[1] || ""

  const result = []

  // Integer part
  for (let i = 0; i < integerPart.length; i++) {
    const digit = parseInt(integerPart[i]!)
    const power = integerPart.length - 1 - i
    const value = digit * Math.pow(10, power)
    let label = ""
    if (power === 0) label = "Ones"
    else if (power === 1) label = "Tens"
    else if (power === 2) label = "Hundreds"
    else if (power === 3) label = "Thousands"
    else if (power === 4) label = "Ten Thousands"
    else if (power === 5) label = "Hundred Thousands"
    else if (power === 6) label = "Millions"
    else label = `10^${power}`

    result.push({ digit, value, label, type: "integer" })
  }

  // Fractional part
  for (let i = 0; i < fractionalPart.length; i++) {
    const digit = parseInt(fractionalPart[i]!)
    const power = -(i + 1)
    const value = digit * Math.pow(10, power)
    let label = ""
    if (power === -1) label = "Tenths"
    else if (power === -2) label = "Hundredths"
    else if (power === -3) label = "Thousandths"
    else label = `10^${power}`

    result.push({ digit, value, label, type: "fraction" })
  }

  return result
})

</script>

<template>
  <section class="number-sense">
    <div class="ns-header">
      <div>
        <p class="eyebrow">Math Tool</p>
        <h1>Number Sense Lab</h1>
        <p class="subtle">Explore place value, rounding, and number patterns.</p>
      </div>
    </div>

    <div class="ns-grid">
      <section class="card">
        <h2>Place Value Explorer</h2>
        <div class="field-row">
          <label>
            <span>Enter a number</span>
            <input v-model.number="inputNumber" type="number" step="any" />
          </label>
        </div>

        <div class="decomposition" v-if="inputNumber !== null">
          <div class="place-card" v-for="(item, index) in placeValues" :key="index" :class="item.type">
            <span class="digit">{{ item.digit }}</span>
            <span class="value">{{ item.value }}</span>
            <span class="label">{{ item.label }}</span>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.number-sense {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.ns-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: flex-start;
}

.ns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  padding: 1.5rem;
  display: grid;
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
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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

.decomposition {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.place-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background: #fff;
  min-width: 80px;
}

.place-card.integer {
  background: rgba(47, 107, 79, 0.05);
  border-color: rgba(47, 107, 79, 0.2);
}

.place-card.fraction {
  background: rgba(201, 107, 60, 0.05);
  border-color: rgba(201, 107, 60, 0.2);
}

.digit {
  font-size: 2rem;
  font-weight: 600;
  font-family: "Source Serif 4", serif;
  color: var(--ink-strong);
}

.value {
  font-size: 0.9rem;
  color: var(--ink-muted);
  font-weight: 500;
}

.label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-muted);
  margin-top: 0.25rem;
}
</style>
