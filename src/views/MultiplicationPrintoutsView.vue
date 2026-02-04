<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { api } from "@/lib/api"

type Mode = "grid" | "worksheet"

const settings = reactive({
  mode: "grid" as Mode,
  gridRowStart: 1,
  gridRowEnd: 12,
  gridColStart: 1,
  gridColEnd: 12,
  worksheetFactorStart: 1,
  worksheetFactorEnd: 12,
  baseStart: 2,
  baseEnd: 12,
  showAnswers: true,
})

const pdfLoading = ref(false)
const pdfError = ref<string | null>(null)

const factorRange = computed(() => {
  const min = Math.max(1, Math.min(settings.worksheetFactorStart, settings.worksheetFactorEnd, 500))
  const max = Math.max(1, Math.min(Math.max(settings.worksheetFactorStart, settings.worksheetFactorEnd), 500))
  return Array.from({ length: max - min + 1 }, (_, idx) => min + idx)
})

const baseRange = computed(() => {
  const min = Math.max(1, Math.min(settings.baseStart, settings.baseEnd, 500))
  const max = Math.max(1, Math.min(Math.max(settings.baseStart, settings.baseEnd), 500))
  return Array.from({ length: max - min + 1 }, (_, idx) => min + idx)
})

const gridRows = computed(() => {
  const min = Math.max(1, Math.min(settings.gridRowStart, settings.gridRowEnd, 500))
  const max = Math.max(1, Math.min(Math.max(settings.gridRowStart, settings.gridRowEnd), 500))
  return Array.from({ length: max - min + 1 }, (_, idx) => min + idx)
})

const gridCols = computed(() => {
  const min = Math.max(1, Math.min(settings.gridColStart, settings.gridColEnd, 500))
  const max = Math.max(1, Math.min(Math.max(settings.gridColStart, settings.gridColEnd), 500))
  return Array.from({ length: max - min + 1 }, (_, idx) => min + idx)
})

function resetDefaults() {
  settings.mode = "grid"
  settings.gridRowStart = 1
  settings.gridRowEnd = 12
  settings.gridColStart = 1
  settings.gridColEnd = 12
  settings.worksheetFactorStart = 1
  settings.worksheetFactorEnd = 12
  settings.baseStart = 2
  settings.baseEnd = 12
  settings.showAnswers = true
}

function printNow() {
  window.print()
}

async function downloadPdf() {
  pdfError.value = null
  pdfLoading.value = true
  try {
    const payload = {
      mode: settings.mode,
      min_factor: settings.worksheetFactorStart,
      max_factor: settings.worksheetFactorEnd,
      row_start: settings.gridRowStart,
      row_end: settings.gridRowEnd,
      col_start: settings.gridColStart,
      col_end: settings.gridColEnd,
      base_start: settings.baseStart,
      base_end: settings.baseEnd,
      show_answers: settings.showAnswers,
    }
    const blob = await api<Blob>("math/multiplication/printouts/pdf", "POST", {
      auth: true,
      body: payload,
      responseType: "blob",
    })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const link = document.createElement("a")
    link.href = url
    link.download = `multiplication_printouts_${stamp}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    pdfError.value = err?.message || "Failed to generate PDF"
  } finally {
    pdfLoading.value = false
  }
}
</script>

<template>
  <section class="printouts">
    <div class="printouts-header">
      <div>
        <p class="eyebrow">Math Tool</p>
        <h1>Multiplication Table Printouts</h1>
        <p class="subtle">Create grid tables or single times-table worksheets and print instantly.</p>
      </div>
      <div class="header-actions no-print">
        <button class="ghost" type="button" @click="resetDefaults">Reset</button>
        <button class="primary" type="button" :disabled="pdfLoading" @click="downloadPdf">
          {{ pdfLoading ? "Preparing PDF..." : "Download PDF" }}
        </button>
        <button class="ghost" type="button" @click="printNow">Print</button>
      </div>
    </div>

    <p v-if="pdfError" class="error no-print">{{ pdfError }}</p>

    <div class="printouts-shell">
      <details class="settings-card no-print" open>
        <summary>Settings</summary>
        <div class="settings-body">
          <div class="field-group">
            <label>
              <span>Layout</span>
              <select v-model="settings.mode">
                <option value="grid">Full grid table</option>
                <option value="worksheet">One table per page</option>
              </select>
            </label>
          </div>

          <div class="field-group" v-if="settings.mode === 'grid'">
            <label>
              <span>Row start</span>
              <input v-model.number="settings.gridRowStart" type="number" min="1" max="500" />
            </label>
            <label>
              <span>Row end</span>
              <input v-model.number="settings.gridRowEnd" type="number" min="1" max="500" />
            </label>
            <label>
              <span>Column start</span>
              <input v-model.number="settings.gridColStart" type="number" min="1" max="500" />
            </label>
            <label>
              <span>Column end</span>
              <input v-model.number="settings.gridColEnd" type="number" min="1" max="500" />
            </label>
          </div>

          <div class="field-group" v-if="settings.mode === 'worksheet'">
            <label>
              <span>Factor start</span>
              <input v-model.number="settings.worksheetFactorStart" type="number" min="1" max="500" />
            </label>
            <label>
              <span>Factor end</span>
              <input v-model.number="settings.worksheetFactorEnd" type="number" min="1" max="500" />
            </label>
          </div>

          <div class="field-group" v-if="settings.mode === 'worksheet'">
            <label>
              <span>Table start</span>
              <input v-model.number="settings.baseStart" type="number" min="1" max="500" />
            </label>
            <label>
              <span>Table end</span>
              <input v-model.number="settings.baseEnd" type="number" min="1" max="500" />
            </label>
          </div>

          <label class="toggle">
            <input v-model="settings.showAnswers" type="checkbox" />
            <span>Show answers</span>
          </label>
          <p class="hint">Tip: turn off answers for student practice sheets.</p>
        </div>
      </details>

      <section class="print-area">
        <div v-if="settings.mode === 'grid'" class="sheet">
          <header class="sheet-header">
            <h2>Multiplication Grid</h2>
            <p>
              Rows {{ gridRows[0] }} to {{ gridRows[gridRows.length - 1] }},
              Columns {{ gridCols[0] }} to {{ gridCols[gridCols.length - 1] }}
            </p>
          </header>
          <div class="grid-scroll">
            <table class="grid-table">
              <thead>
                <tr>
                  <th>×</th>
                  <th v-for="col in gridCols" :key="`col-${col}`">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in gridRows" :key="`row-${row}`">
                  <th>{{ row }}</th>
                  <td v-for="col in gridCols" :key="`cell-${row}-${col}`">
                    <span v-if="settings.showAnswers">{{ row * col }}</span>
                    <span v-else class="blank"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="worksheets">
          <article class="sheet" v-for="base in baseRange" :key="`sheet-${base}`">
            <header class="sheet-header">
              <h2>Times Table of {{ base }}</h2>
              <p>Factors {{ factorRange[0] }} to {{ factorRange[factorRange.length - 1] }}</p>
            </header>
            <div class="worksheet-grid">
              <div v-for="factor in factorRange" :key="`row-${base}-${factor}`" class="worksheet-row">
                <span>{{ base }} × {{ factor }} =</span>
                <span v-if="settings.showAnswers" class="answer">{{ base * factor }}</span>
                <span v-else class="line"></span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.printouts {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.printouts-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.primary {
  border: none;
  background: var(--accent);
  color: #fff;
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
}

.printouts-shell {
  display: grid;
  grid-template-columns: minmax(220px, 280px) 1fr;
  gap: 2rem;
  align-items: start;
}

.settings-card {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  padding: 1.25rem;
  display: grid;
  gap: 1rem;
}

.settings-card summary {
  cursor: pointer;
  font-family: "Source Serif 4", serif;
  font-size: 1.1rem;
  font-weight: 600;
  list-style: none;
}

.settings-card summary::-webkit-details-marker {
  display: none;
}

.settings-card summary::after {
  content: "+";
  float: right;
  font-size: 1.1rem;
  color: var(--ink-muted);
}

.settings-card[open] summary::after {
  content: "−";
}

.field-group {
  display: grid;
  gap: 0.75rem;
}

.field-group label,
.toggle {
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
}

.field-group input,
.field-group select {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: #fafbfa;
  font-size: 0.95rem;
  width: 100%;
}

.toggle {
  grid-auto-flow: column;
  align-items: center;
  justify-content: start;
  gap: 0.6rem;
}

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--ink-muted);
}

.print-area {
  display: grid;
  gap: 1.5rem;
}

.sheet {
  background: #fff;
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  padding: 1.5rem;
  break-inside: avoid;
}

.sheet-header h2 {
  margin: 0;
  font-family: "Source Serif 4", serif;
}

.sheet-header p {
  margin: 0.3rem 0 0;
  color: var(--ink-muted);
}

.grid-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.25rem;
  font-size: 0.95rem;
  min-width: max-content;
}

.grid-table th,
.grid-table td {
  border: 1px solid var(--border-soft);
  padding: 0.5rem;
  text-align: center;
}

.grid-table thead th {
  background: #f3f4f2;
  font-weight: 600;
}

.blank {
  display: inline-block;
  width: 2.2rem;
  height: 1rem;
  border-bottom: 1px solid #c2c6bf;
}

.worksheets {
  display: grid;
  gap: 1.5rem;
}

.worksheet-grid {
  margin-top: 1.25rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem 1.5rem;
}

.worksheet-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.worksheet-row .line {
  flex: 1;
  border-bottom: 1px solid #c2c6bf;
}

.worksheet-row .answer {
  font-weight: 600;
}

@media (max-width: 960px) {
  .printouts-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .printouts-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions button {
    width: 100%;
  }

  .settings-card {
    padding: 1rem;
  }

  .settings-body {
    padding-top: 0.75rem;
  }

  .sheet {
    padding: 1rem;
  }

  .grid-table th,
  .grid-table td {
    padding: 0.35rem;
    font-size: 0.8rem;
  }

  .worksheet-grid {
    grid-template-columns: 1fr;
  }

  .worksheet-row {
    font-size: 0.9rem;
  }
}

.grid-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.25rem;
}
</style>
