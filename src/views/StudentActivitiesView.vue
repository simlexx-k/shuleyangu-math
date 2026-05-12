<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import { api } from "@/lib/api"

type ActivitySummary = {
  id: number
  title: string
  description?: string | null
  grade_label?: string | null
  activity_type: string
  question_count: number
  code_count: number
  attempt_count: number
  submitted_count: number
  average_percentage?: number | null
  created_at?: string | null
}

type ActivityCode = {
  id: number
  code: string
  label?: string | null
  max_uses?: number | null
  used_count: number
  is_active: boolean
}

type ActivityDetail = ActivitySummary & {
  codes: ActivityCode[]
  attempts: Array<{
    id: number
    learner_name?: string | null
    code?: string | null
    score?: number | null
    total?: number | null
    percentage_score?: number | null
    is_submitted: boolean
  }>
}

const activities = ref<ActivitySummary[]>([])
const selected = ref<ActivityDetail | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const codeLoading = ref(false)

const form = reactive({
  title: "Multiplication Fluency Game",
  description: "Interactive multiplication practice for today's lesson.",
  gradeLabel: "Grade 4",
  activityType: "practice",
  problemCount: 12,
  factorStart: 1,
  factorEnd: 12,
  tableStart: 1,
  tableEnd: 12,
  codeCount: 30,
  codeMaxUses: 1,
  allowNickname: true,
  showFeedback: true,
})

const gradeOptions = ["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"]

const selectedCodes = computed(() => selected.value?.codes ?? [])
const playUrl = computed(() => `${window.location.origin}/play`)

async function loadActivities() {
  loading.value = true
  error.value = null
  try {
    activities.value = await api<ActivitySummary[]>("math/activities", "GET", { auth: true })
    if (!selected.value && activities.value[0]) {
      await loadActivity(activities.value[0].id)
    }
  } catch (err: any) {
    error.value = err?.message || "Failed to load activities"
  } finally {
    loading.value = false
  }
}

async function loadActivity(id: number) {
  error.value = null
  selected.value = await api<ActivityDetail>(`math/activities/${id}`, "GET", { auth: true })
}

async function createActivity() {
  saving.value = true
  error.value = null
  try {
    const created = await api<ActivityDetail>("math/activities", "POST", {
      auth: true,
      body: {
        title: form.title,
        description: form.description,
        grade_label: form.gradeLabel,
        activity_type: form.activityType,
        problem_count: form.problemCount,
        factor_start: form.factorStart,
        factor_end: form.factorEnd,
        table_start: form.tableStart,
        table_end: form.tableEnd,
        code_count: form.codeCount,
        code_max_uses: form.codeMaxUses,
        allow_nickname: form.allowNickname,
        show_feedback: form.showFeedback,
      },
    })
    selected.value = created
    await loadActivities()
    await loadActivity(created.id)
  } catch (err: any) {
    error.value = err?.message || "Failed to create activity"
  } finally {
    saving.value = false
  }
}

async function addCodes() {
  if (!selected.value) return
  codeLoading.value = true
  error.value = null
  try {
    await api(`math/activities/${selected.value.id}/codes`, "POST", {
      auth: true,
      body: { count: 10, max_uses: form.codeMaxUses, label_prefix: "Extra" },
    })
    await loadActivity(selected.value.id)
    await loadActivities()
  } catch (err: any) {
    error.value = err?.message || "Failed to add codes"
  } finally {
    codeLoading.value = false
  }
}

async function downloadCodesPdf() {
  if (!selected.value) return
  const blob = await api<Blob>(`math/activities/${selected.value.id}/codes/pdf`, "GET", {
    auth: true,
    responseType: "blob",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `student_activity_codes_${selected.value.id}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

onMounted(loadActivities)
</script>

<template>
  <section class="activities-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Teacher Tool</p>
        <h1>Student Math Activities</h1>
        <p class="subtle">Generate join codes for interactive student practice and print slips for class distribution.</p>
      </div>
      <RouterLink class="secondary" to="/play">Open Student Play</RouterLink>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="activity-layout">
      <form class="panel create-panel" @submit.prevent="createActivity">
        <h2>Create activity</h2>
        <label>
          <span>Title</span>
          <input v-model="form.title" required />
        </label>
        <label>
          <span>Description</span>
          <textarea v-model="form.description" rows="3"></textarea>
        </label>
        <div class="field-grid">
          <label>
            <span>Grade</span>
            <select v-model="form.gradeLabel">
              <option v-for="grade in gradeOptions" :key="grade" :value="grade">{{ grade }}</option>
            </select>
          </label>
          <label>
            <span>Mode</span>
            <select v-model="form.activityType">
              <option value="practice">Practice</option>
              <option value="fluency">Fluency</option>
              <option value="challenge">Challenge</option>
            </select>
          </label>
          <label>
            <span>Questions</span>
            <input v-model.number="form.problemCount" type="number" min="4" max="40" />
          </label>
          <label>
            <span>Codes</span>
            <input v-model.number="form.codeCount" type="number" min="1" max="120" />
          </label>
          <label>
            <span>Factor start</span>
            <input v-model.number="form.factorStart" type="number" min="1" max="20" />
          </label>
          <label>
            <span>Factor end</span>
            <input v-model.number="form.factorEnd" type="number" min="1" max="20" />
          </label>
          <label>
            <span>Table start</span>
            <input v-model.number="form.tableStart" type="number" min="1" max="20" />
          </label>
          <label>
            <span>Table end</span>
            <input v-model.number="form.tableEnd" type="number" min="1" max="20" />
          </label>
        </div>
        <label class="check-row"><input v-model="form.allowNickname" type="checkbox" /> Allow learner name</label>
        <label class="check-row"><input v-model="form.showFeedback" type="checkbox" /> Show feedback after submit</label>
        <button class="primary" type="submit" :disabled="saving">{{ saving ? "Creating..." : "Create codes" }}</button>
      </form>

      <section class="activity-main">
        <div class="panel">
          <div class="panel-title">
            <h2>Activities</h2>
            <button class="ghost" type="button" @click="loadActivities">{{ loading ? "Loading..." : "Refresh" }}</button>
          </div>
          <div class="activity-list">
            <button
              v-for="activity in activities"
              :key="activity.id"
              :class="selected?.id === activity.id ? 'activity-item active' : 'activity-item'"
              type="button"
              @click="loadActivity(activity.id)"
            >
              <strong>{{ activity.title }}</strong>
              <span>{{ activity.grade_label }} · {{ activity.question_count }} questions · {{ activity.code_count }} codes</span>
              <span>{{ activity.submitted_count }} submitted · Avg {{ activity.average_percentage ?? "—" }}%</span>
            </button>
            <p v-if="!activities.length && !loading" class="subtle">No activities yet.</p>
          </div>
        </div>

        <div v-if="selected" class="panel detail-panel">
          <div class="panel-title">
            <div>
              <h2>{{ selected.title }}</h2>
              <p class="subtle">{{ selected.description }}</p>
            </div>
            <div class="detail-actions">
              <button class="ghost" type="button" :disabled="codeLoading" @click="addCodes">Add 10 codes</button>
              <button class="primary" type="button" @click="downloadCodesPdf">Print codes PDF</button>
            </div>
          </div>

          <div class="stat-grid compact-stats">
            <div class="stat-card">
              <span class="stat-label">Join page</span>
              <span class="stat-value small">{{ playUrl }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Attempts</span>
              <span class="stat-value">{{ selected.attempt_count }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Submitted</span>
              <span class="stat-value">{{ selected.submitted_count }}</span>
            </div>
          </div>

          <h3>Codes</h3>
          <div class="code-grid">
            <div v-for="code in selectedCodes" :key="code.id" class="code-card">
              <strong>{{ code.code }}</strong>
              <span>{{ code.label }}</span>
              <span>{{ code.used_count }} / {{ code.max_uses }} used</span>
            </div>
          </div>

          <h3>Recent attempts</h3>
          <div class="attempt-table">
            <div class="attempt-row heading">
              <span>Learner</span>
              <span>Code</span>
              <span>Score</span>
            </div>
            <div v-for="attempt in selected.attempts" :key="attempt.id" class="attempt-row">
              <span>{{ attempt.learner_name || "Unnamed" }}</span>
              <span>{{ attempt.code }}</span>
              <span>{{ attempt.is_submitted ? `${attempt.score}/${attempt.total} (${attempt.percentage_score}%)` : "In progress" }}</span>
            </div>
            <p v-if="!selected.attempts.length" class="subtle">No attempts yet.</p>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.activities-page {
  display: grid;
  gap: 1.5rem;
}

.page-header,
.panel-title,
.detail-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1,
.panel h2 {
  margin: 0.25rem 0;
  font-family: "Source Serif 4", serif;
}

.activity-layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

.panel {
  background: var(--card-bg);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 14px 30px rgba(29, 31, 27, 0.06);
}

.create-panel {
  display: grid;
  gap: 0.9rem;
  position: sticky;
  top: 96px;
}

label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
}

input,
select,
textarea {
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: #fafbfa;
  padding: 0.6rem 0.7rem;
  color: var(--ink-strong);
  font: inherit;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.check-row {
  grid-template-columns: auto 1fr;
  align-items: center;
  color: var(--ink-strong);
}

.activity-main {
  display: grid;
  gap: 1rem;
}

.activity-list {
  display: grid;
  gap: 0.6rem;
}

.activity-item {
  display: grid;
  gap: 0.25rem;
  text-align: left;
  border: 1px solid var(--border-soft);
  background: #fff;
  border-radius: 12px;
  padding: 0.85rem;
  cursor: pointer;
}

.activity-item span,
.code-card span {
  color: var(--ink-muted);
  font-size: 0.85rem;
}

.activity-item.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.compact-stats {
  margin: 1rem 0;
}

.stat-value.small {
  font-size: 0.9rem;
  word-break: break-all;
}

.code-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.code-card {
  display: grid;
  gap: 0.25rem;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 0.85rem;
  background: #fafbf8;
}

.code-card strong {
  font-size: 1.15rem;
  color: var(--accent);
  letter-spacing: 0.08em;
}

.attempt-table {
  display: grid;
  gap: 0.35rem;
}

.attempt-row {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 1fr;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border-soft);
  padding: 0.45rem 0;
}

.attempt-row.heading {
  color: var(--ink-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

@media (max-width: 960px) {
  .activity-layout {
    grid-template-columns: 1fr;
  }

  .create-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .field-grid,
  .attempt-row {
    grid-template-columns: 1fr;
  }
}
</style>
