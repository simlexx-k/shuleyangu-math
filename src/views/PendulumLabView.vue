<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue"
import { calculatePendulumPeriod, calculateFrequency, GRAVITY } from "@/lib/physics"

const length = ref(1.0)
const gravity = ref(GRAVITY.EARTH)
const gravityName = ref("Earth")

// Physics state
const angle = ref(Math.PI / 4) // Initial angle 45 degrees
const angularVelocity = ref(0)
const time = ref(0)
let animationId: number | null = null

const canvasRef = ref<HTMLCanvasElement | null>(null)

const period = computed(() => calculatePendulumPeriod(length.value, gravity.value))
const frequency = computed(() => calculateFrequency(period.value))

const gravityOptions = [
  { name: "Earth", value: GRAVITY.EARTH },
  { name: "Moon", value: GRAVITY.MOON },
  { name: "Mars", value: GRAVITY.MARS },
  { name: "Jupiter", value: GRAVITY.JUPITER },
]

function setGravity(val: number, name: string) {
  gravity.value = val
  gravityName.value = name
}

// Animation Loop
const draw = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const centerX = width / 2
  const centerY = 50 // Pivot point
  const scale = 150 // Pixels per meter

  // Update physics
  // Simple harmonic motion approx for small angles: theta(t) = theta0 * cos(sqrt(g/L)*t)
  // But let's use the exact numerical integration if we want more realism, or just the simple formula for "Virtual Lab" simplicity.
  // Actually, for a lab, exact simple harmonic motion formula is fine for demonstration.
  // theta(t) = A * cos(omega * t)
  const omega = Math.sqrt(gravity.value / length.value)
  // Let's increment time
  const dt = 1/60
  time.value += dt

  const currentAngle = (Math.PI / 4) * Math.cos(omega * time.value)

  // Clear
  ctx.clearRect(0, 0, width, height)

  // Draw Pivot
  ctx.beginPath()
  ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI)
  ctx.fillStyle = "#333"
  ctx.fill()

  // Calculate bob position
  const bobX = centerX + Math.sin(currentAngle) * length.value * scale
  const bobY = centerY + Math.cos(currentAngle) * length.value * scale

  // Draw String
  ctx.beginPath()
  ctx.moveTo(centerX, centerY)
  ctx.lineTo(bobX, bobY)
  ctx.strokeStyle = "#666"
  ctx.lineWidth = 2
  ctx.stroke()

  // Draw Bob
  ctx.beginPath()
  ctx.arc(bobX, bobY, 15, 0, 2 * Math.PI)
  ctx.fillStyle = "var(--accent, #e91e63)" // Use variable or fallback
  ctx.fill()
  ctx.strokeStyle = "#333"
  ctx.lineWidth = 1
  ctx.stroke()

  animationId = requestAnimationFrame(draw)
}

onMounted(() => {
  // Start animation
  time.value = 0
  draw()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})

// Reset time when parameters change to avoid jump
watch([length, gravity], () => {
   // Optional: reset phase or time.
   // If we change L or g, the phase might jump if we keep t.
   // But continuously updating is also fine. Let's keep t continuous but maybe reset if it feels weird.
   // For SHM: theta = A cos(sqrt(g/L)t). If sqrt(g/L) changes, the argument changes abruptly.
   // Ideally we keep the current angle and velocity and continue integration, but for simple viz, resetting t is okay-ish, or just letting it jump.
   // Let's reset t to 0 for a clean restart of the cycle on change, usually better for "Lab" observation.
   time.value = 0
})

</script>

<template>
  <section class="lab">
    <div class="lab-header">
      <div>
        <p class="eyebrow">Virtual Lab</p>
        <h1>Pendulum Lab</h1>
        <p class="subtle">Explore the relationship between length, gravity, and period.</p>
      </div>
    </div>

    <div class="lab-grid">
      <section class="card control-panel">
        <h2>Parameters</h2>
        <div class="field-row">
          <label>
            <span>Length (L)</span>
            <div class="range-container">
                <input v-model.number="length" type="range" min="0.1" max="2.0" step="0.1" />
                <span>{{ length.toFixed(1) }} m</span>
            </div>
          </label>
        </div>

        <div class="field-group">
          <label>Gravity (g)</label>
          <div class="gravity-buttons">
            <button
                v-for="opt in gravityOptions"
                :key="opt.name"
                @click="setGravity(opt.value, opt.name)"
                :class="{ active: gravityName === opt.name }"
            >
                {{ opt.name }}
            </button>
          </div>
           <p class="gravity-value">{{ gravity.toFixed(2) }} m/s²</p>
        </div>

        <div class="stats">
            <p><strong>Period (T):</strong> {{ period.toFixed(3) }} s</p>
            <p><strong>Frequency (f):</strong> {{ frequency.toFixed(3) }} Hz</p>
            <p class="formula">T = 2π√(L/g)</p>
        </div>
      </section>

      <section class="card visualization">
        <h2>Simulation</h2>
        <div class="canvas-container">
            <canvas ref="canvasRef" width="400" height="400"></canvas>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.lab {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.lab-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: flex-start;
}

.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-soft, #ddd);
  border-radius: 18px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 16px 30px rgba(29, 31, 27, 0.06);
}

.card h2 {
  margin: 0;
  font-family: "Source Serif 4", serif;
  font-size: 1.25rem;
}

.field-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.range-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

input[type="range"] {
    flex: 1;
}

.gravity-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

button {
    padding: 0.5rem 0.8rem;
    border: 1px solid var(--border-soft, #ddd);
    background: #fafbfa;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
}

button.active {
    background: var(--accent, #e91e63);
    color: white;
    border-color: var(--accent, #e91e63);
}

.gravity-value {
    font-size: 0.85rem;
    color: var(--ink-muted, #666);
    margin-top: 0.25rem;
}

.stats {
    background: #fafbfa;
    padding: 1rem;
    border-radius: 12px;
    font-size: 0.95rem;
    display: grid;
    gap: 0.5rem;
}

.formula {
    margin-top: 0.5rem;
    font-style: italic;
    color: var(--ink-muted, #666);
    font-family: serif;
}

.canvas-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f0f0f0;
    border-radius: 12px;
    overflow: hidden;
}

canvas {
    background: white;
    width: 100%;
    max-width: 400px;
    height: auto;
    aspect-ratio: 1;
}
</style>
